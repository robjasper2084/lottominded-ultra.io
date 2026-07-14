import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { AccountLedgerStore } from "../account/store";

type GameId = "shadow_ops" | "fighter";
type RewardEvent = {
  eventId: string;
  seq: number;
  type: string;
  clientElapsedMs: number;
  payload: Record<string, unknown>;
};

type RewardSession = {
  id: string;
  userId: string;
  gameId: GameId;
  mode: string;
  buildId: string;
  createdAt: number;
  expiresAt: number;
  launchTokenHash: string;
  eventTokenHash: string | null;
  expectedSequence: number;
  events: RewardEvent[];
};

const COOKIE_NAME = "lottomind_session";
const APPROVED_BUILDS: Record<GameId, Set<string>> = {
  shadow_ops: new Set(["shadow-ops-2026-06-25"]),
  fighter: new Set(["fighter-2026-06-25"]),
};
const FORBIDDEN_REWARD_FIELDS = new Set(["reward", "rewardAmount", "credits", "creditAmount", "userId", "accountId", "walletId"]);

function opaqueToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function secureEqual(value: string, expectedHash: string): boolean {
  const supplied = Buffer.from(digest(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function sessionToken(request: Request): string {
  const cookies = Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
  return cookies[COOKIE_NAME] || "";
}

function text(value: unknown, maximum = 128): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasForbiddenField(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== "object" || depth > 4) return false;
  if (Array.isArray(value)) return value.some((entry) => hasForbiddenField(entry, depth + 1));
  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => FORBIDDEN_REWARD_FIELDS.has(key) || hasForbiddenField(entry, depth + 1));
}

function apiError(response: Response, status: number, code: string, message: string): Response {
  return response.status(status).json({ error: { code, message } });
}

function bearerToken(request: Request): string {
  const header = String(request.headers.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function validateEvent(raw: unknown, gameId: GameId, expectedSequence: number): RewardEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || hasForbiddenField(raw)) return null;
  const value = raw as Record<string, unknown>;
  const eventId = text(value.eventId, 100);
  const type = text(value.type, 100);
  const seq = number(value.seq);
  const clientElapsedMs = number(value.clientElapsedMs);
  const payload = value.payload;
  if (!/^[a-zA-Z0-9:_-]{8,100}$/.test(eventId) || seq !== expectedSequence || !type.startsWith(gameId === "fighter" ? "fighter." : "shadow.")) return null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || clientElapsedMs < 0 || clientElapsedMs > 60 * 60 * 1000) return null;
  return { eventId, seq, type, clientElapsedMs, payload: payload as Record<string, unknown> };
}

function assessResult(session: RewardSession, completionEventId: string): null | {
  gameTitle: string;
  outcome: string;
  milestones: Array<"shadow.campaign_completed" | "fighter.match_completed" | "fighter.match_win">;
} {
  const terminal = session.events.find((event) => event.eventId === completionEventId);
  const elapsed = Date.now() - session.createdAt;
  if (!terminal) return null;

  if (session.gameId === "shadow_ops") {
    if (terminal.type !== "shadow.campaign_completed" || elapsed < 4 * 60 * 1000) return null;
    const started = session.events.some((event) => event.type === "shadow.run_started" && event.payload.debug !== true);
    const completedLevels = session.events.filter((event) => event.type === "shadow.level_completed" && event.payload.bossDefeated === true && event.payload.extractionReached === true);
    const levelIds = new Set(completedLevels.map((event) => String(event.payload.levelId || "")));
    const campaignIds = Array.isArray(terminal.payload.completedLevelIds) ? terminal.payload.completedLevelIds.map(String) : [];
    if (!started || !["1", "2", "3"].every((id) => levelIds.has(id) && campaignIds.includes(id)) || number(terminal.payload.totalCampaignTimeMs) < 4 * 60 * 1000) return null;
    return { gameTitle: "Shadow Ops Canvas", outcome: "Campaign completed", milestones: ["shadow.campaign_completed"] };
  }

  if (terminal.type !== "fighter.match_completed" || elapsed < 30_000 || session.mode !== "versus_cpu") return null;
  const started = session.events.find((event) => event.type === "fighter.match_started");
  const rounds = session.events.filter((event) => event.type === "fighter.round_completed");
  const playerWon = terminal.payload.winningSide === "player";
  const validRounds = rounds.length >= 2 && rounds.every((event) => number(event.payload.durationTicks) > 0 && number(event.payload.meaningfulActionCount) > 0);
  if (!started || started.payload.trainingMode === true || started.payload.debug === true || terminal.payload.trainingMode === true || terminal.payload.debug === true || !validRounds || number(terminal.payload.totalMatchTicks) < 1_800) return null;
  return {
    gameTitle: "GOTHTECHNOLOGY",
    outcome: playerWon ? "Match won" : "Match completed",
    milestones: playerWon ? ["fighter.match_completed", "fighter.match_win"] : ["fighter.match_completed"],
  };
}

export function createGameRewardsRouter(store: AccountLedgerStore): Router {
  const router = Router();
  const sessions = new Map<string, RewardSession>();

  router.post("/game-sessions", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      if (!snapshot.authenticated || !snapshot.user) return apiError(response, 401, "AUTH_REQUIRED", "Sign in to connect game results to your LottoMind wallet.");
      const gameId = text(request.body?.gameId, 40) as GameId;
      const mode = text(request.body?.mode, 40);
      const buildId = text(request.body?.buildId, 80);
      if (!(gameId in APPROVED_BUILDS) || !mode || !APPROVED_BUILDS[gameId].has(buildId)) return apiError(response, 403, "BUILD_NOT_APPROVED", "This game build is not approved for wallet rewards.");
      if (request.body?.userId || request.body?.credits || request.body?.rewardAmount) return apiError(response, 400, "INVALID_EVENT_SCHEMA", "Client-supplied identity or rewards are not allowed.");
      const active = [...sessions.values()].filter((session) => session.userId === snapshot.user?.id && session.gameId === gameId && session.expiresAt > Date.now()).length;
      if (active >= 3) return apiError(response, 429, "SESSION_LIMIT_REACHED", "Finish an active game before starting another reward session.");
      for (const [id, session] of sessions) if (session.expiresAt <= Date.now()) sessions.delete(id);
      const launchToken = opaqueToken("launch");
      const session: RewardSession = {
        id: randomUUID(), userId: snapshot.user.id, gameId, mode, buildId,
        createdAt: Date.now(), expiresAt: Date.now() + 45 * 60 * 1000,
        launchTokenHash: digest(launchToken), eventTokenHash: null, expectedSequence: 1, events: [],
      };
      sessions.set(session.id, session);
      response.status(201).json({ sessionId: session.id, launchToken, gameId, mode, buildId, eventSequenceStartsAt: 1, eligible: mode !== "training", expiresAt: new Date(session.expiresAt).toISOString() });
    } catch {
      apiError(response, 500, "REWARD_SERVICE_ERROR", "The game reward service is temporarily unavailable.");
    }
  });

  router.post("/game-sessions/:sessionId/exchange", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      const session = sessions.get(text(request.params.sessionId, 100));
      if (!snapshot.authenticated || !snapshot.user) return apiError(response, 401, "AUTH_REQUIRED", "Sign in to continue the reward session.");
      if (!session) return apiError(response, 404, "SESSION_NOT_FOUND", "Reward session not found.");
      if (session.userId !== snapshot.user.id) return apiError(response, 403, "SESSION_NOT_OWNED", "Reward session does not belong to this account.");
      const launchToken = text(request.body?.launchToken, 128);
      if (!launchToken || session.eventTokenHash || !secureEqual(launchToken, session.launchTokenHash)) return apiError(response, 401, "AUTH_REQUIRED", "Launch token is invalid or already used.");
      const eventToken = opaqueToken("event");
      session.eventTokenHash = digest(eventToken);
      response.json({ sessionId: session.id, eventToken, expiresAt: new Date(session.expiresAt).toISOString() });
    } catch {
      apiError(response, 500, "REWARD_SERVICE_ERROR", "The game reward service is temporarily unavailable.");
    }
  });

  router.post("/game-sessions/:sessionId/events", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      const session = sessions.get(text(request.params.sessionId, 100));
      if (!snapshot.authenticated || !snapshot.user) return apiError(response, 401, "AUTH_REQUIRED", "Sign in to record game results.");
      if (!session) return apiError(response, 404, "SESSION_NOT_FOUND", "Reward session not found.");
      if (session.userId !== snapshot.user.id) return apiError(response, 403, "SESSION_NOT_OWNED", "Reward session does not belong to this account.");
      if (session.expiresAt <= Date.now()) return apiError(response, 410, "SESSION_EXPIRED", "Reward session expired.");
      const token = bearerToken(request);
      if (!token || !session.eventTokenHash || !secureEqual(token, session.eventTokenHash)) return apiError(response, 401, "AUTH_REQUIRED", "Event token is invalid.");
      const rawEvents = request.body?.events;
      if (!Array.isArray(rawEvents) || rawEvents.length < 1 || rawEvents.length > 50) return apiError(response, 400, "INVALID_EVENT_SCHEMA", "Event batch must contain 1 to 50 events.");
      for (const raw of rawEvents) {
        const event = validateEvent(raw, session.gameId, session.expectedSequence);
        if (!event || session.events.some((stored) => stored.eventId === event.eventId)) return apiError(response, 422, "INVALID_STATE_TRANSITION", "Game event order or content could not be verified.");
        session.events.push(event);
        session.expectedSequence += 1;
      }
      response.json({ acceptedThrough: session.expectedSequence - 1, sessionStatus: "active", riskStatus: "normal" });
    } catch {
      apiError(response, 500, "REWARD_SERVICE_ERROR", "The game reward service is temporarily unavailable.");
    }
  });

  router.post("/game-sessions/:sessionId/finalize", async (request, response) => {
    try {
      const token = sessionToken(request);
      const snapshot = await store.snapshot(token);
      const session = sessions.get(text(request.params.sessionId, 100));
      if (!snapshot.authenticated || !snapshot.user) return apiError(response, 401, "AUTH_REQUIRED", "Sign in to add results to your wallet.");
      if (!session) return apiError(response, 404, "SESSION_NOT_FOUND", "Reward session not found.");
      if (session.userId !== snapshot.user.id) return apiError(response, 403, "SESSION_NOT_OWNED", "Reward session does not belong to this account.");
      const idempotencyKey = text(request.body?.idempotencyKey, 128);
      const completionEventId = text(request.body?.completionEventId, 100);
      const result = assessResult(session, completionEventId);
      if (!result) return apiError(response, 422, "INVALID_STATE_TRANSITION", "The game result has not reached a verified reward milestone.");
      const granted = await store.grantGameReward(token, { gameId: session.gameId, ...result, idempotencyKey });
      response.json({
        status: "rewarded",
        reward: { amount: granted.amount, bucket: "promotional", milestone: result.milestones[0] },
        rewards: result.milestones.map((milestone) => ({ milestone, amount: milestone === "shadow.campaign_completed" ? 10 : milestone === "fighter.match_win" ? 1 : 2, bucket: "promotional" })),
        wallet: { promotionalBalance: granted.balance, monthlyBalance: 0, purchasedBalance: 0, totalBalance: granted.balance, version: 1 },
        transactionId: granted.transactionId,
      });
    } catch (error) {
      const typed = error as Error & { code?: string; status?: number };
      apiError(response, typed.status || 500, typed.code || "REWARD_SERVICE_ERROR", typed.status && typed.status < 500 ? typed.message : "The game reward service is temporarily unavailable.");
    }
  });

  return router;
}
