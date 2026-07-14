import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { BEAT2LOTTO_CREDIT_ACTIONS, BEAT2LOTTO_FEATURES, type Beat2LottoCreditAction } from "./feature-config";
import type { AccountDatabase, AccountSnapshot, CollectibleInventoryStatus, LedgerTransaction, MembershipRecord, UserRecord } from "./types";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;
const COLLECTOR_DAYS = 30;
const COLLECTOR_CREDITS = 150;
const COLLECTOR_BADGE = "vault-guardian-series-01";
const GAME_REWARD_AMOUNTS = {
  "shadow.campaign_completed": 10,
  "fighter.match_completed": 2,
  "fighter.match_win": 1,
} as const;

type GameRewardMilestone = keyof typeof GAME_REWARD_AMOUNTS;

function emptyDatabase(): AccountDatabase {
  return { version: 1, users: [], sessions: [], collectibles: [], transactions: [], idempotency: {}, analytics: [] };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 254);
}

function publicError(code: string, message: string, status = 400): Error & { code: string; status: number } {
  return Object.assign(new Error(message), { code, status });
}

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * 86_400_000).toISOString();
}

export class AccountLedgerStore {
  private database: AccountDatabase = emptyDatabase();
  private initialized = false;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly redemptionPepper: string,
    private readonly featureEnabled = true,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async init(forceReload = false): Promise<void> {
    if (this.initialized && !forceReload) return;
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as AccountDatabase;
      if (parsed?.version === 1) this.database = parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    this.initialized = true;
  }

  private async commit(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(this.database, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.filePath);
  }

  private async mutate<T>(operation: () => Promise<T> | T): Promise<T> {
    const task = this.writeQueue.then(async () => {
      await this.init(true);
      const result = await operation();
      await this.commit();
      return result;
    });
    this.writeQueue = task.catch(() => undefined);
    return task;
  }

  private hashSession(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private hashCollectible(code: string): string {
    return createHmac("sha256", this.redemptionPepper).update(code.trim().toUpperCase()).digest("hex");
  }

  private async passwordDigest(password: string, salt: string): Promise<string> {
    return Buffer.from(await scrypt(password, salt, 64) as Buffer).toString("hex");
  }

  private async createSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    const current = this.now();
    this.database.sessions = this.database.sessions.filter((session) => Date.parse(session.expiresAt) > current.getTime());
    this.database.sessions.push({ tokenHash: this.hashSession(token), userId, createdAt: current.toISOString(), expiresAt: addDays(current, SESSION_DAYS) });
    return token;
  }

  async register(input: { email: string; password: string; displayName?: string }): Promise<{ token: string; snapshot: AccountSnapshot }> {
    const email = normalizeEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw publicError("INVALID_EMAIL", "Enter a valid email address.");
    if (input.password.length < 10) throw publicError("WEAK_PASSWORD", "Use at least 10 characters for the password.");
    return this.mutate(async () => {
      if (this.database.users.some((user) => user.email === email)) throw publicError("ACCOUNT_EXISTS", "An account already exists for this email.", 409);
      const salt = randomBytes(16).toString("hex");
      const current = this.now().toISOString();
      const user: UserRecord = {
        id: randomUUID(),
        email,
        displayName: String(input.displayName || email.split("@")[0]).trim().slice(0, 80),
        passwordSalt: salt,
        passwordHash: await this.passwordDigest(input.password, salt),
        createdAt: current,
        credits: 0,
        memberships: [],
        badges: [],
      };
      this.database.users.push(user);
      const token = await this.createSession(user.id);
      return { token, snapshot: this.snapshotForUser(user) };
    });
  }

  async login(input: { email: string; password: string }): Promise<{ token: string; snapshot: AccountSnapshot }> {
    const email = normalizeEmail(input.email);
    return this.mutate(async () => {
      const user = this.database.users.find((candidate) => candidate.email === email);
      if (!user) throw publicError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
      const supplied = Buffer.from(await this.passwordDigest(input.password, user.passwordSalt), "hex");
      const expected = Buffer.from(user.passwordHash, "hex");
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw publicError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
      const token = await this.createSession(user.id);
      return { token, snapshot: this.snapshotForUser(user) };
    });
  }

  async logout(token: string): Promise<void> {
    await this.mutate(() => {
      const hash = this.hashSession(token);
      this.database.sessions = this.database.sessions.filter((session) => session.tokenHash !== hash);
    });
  }

  private userForToken(token: string): UserRecord | null {
    if (!token) return null;
    const current = this.now().getTime();
    const session = this.database.sessions.find((candidate) => candidate.tokenHash === this.hashSession(token) && Date.parse(candidate.expiresAt) > current);
    return session ? this.database.users.find((user) => user.id === session.userId) || null : null;
  }

  async snapshot(token = ""): Promise<AccountSnapshot> {
    await this.init(true);
    return this.snapshotForUser(this.userForToken(token));
  }

  async billingIdentity(token: string): Promise<{ id: string; email: string; stripeCustomerId?: string } | null> {
    await this.init(true);
    const user = this.userForToken(token);
    return user ? { id: user.id, email: user.email, stripeCustomerId: user.stripeCustomerId } : null;
  }

  async applyStripeCheckout(input: {
    userId: string;
    lookupKey: string;
    customerId?: string;
    eventId: string;
  }): Promise<void> {
    await this.mutate(() => {
      const user = this.database.users.find((candidate) => candidate.id === input.userId);
      if (!user) throw publicError("ACCOUNT_NOT_FOUND", "The Stripe checkout account could not be found.", 404);
      const idempotencyKey = `stripe:${input.eventId}`;
      if (this.database.idempotency[idempotencyKey]) return;
      if (input.customerId) user.stripeCustomerId = input.customerId;

      const membershipLookup: Record<string, { kind: "gold" | "ultra" | "vault"; days: number | null; autoRenew: boolean }> = {
        gold_monthly: { kind: "gold", days: 32, autoRenew: true },
        gold_yearly: { kind: "gold", days: 370, autoRenew: true },
        ultra_monthly: { kind: "ultra", days: 32, autoRenew: true },
        ultra_yearly: { kind: "ultra", days: 370, autoRenew: true },
        vault_founder_once: { kind: "vault", days: null, autoRenew: false },
        vault_yearly: { kind: "vault", days: 370, autoRenew: true },
        vault_lifetime_once: { kind: "vault", days: null, autoRenew: false },
      };
      const creditLookup: Record<string, number> = {
        credits_starter_once: 50,
        credits_studio_once: 125,
        credits_vault_once: 300,
      };

      const membership = membershipLookup[input.lookupKey];
      const credits = creditLookup[input.lookupKey];
      if (membership) {
        const startsAt = this.now();
        const expiresAt = membership.days ? addDays(startsAt, membership.days) : null;
        user.memberships = user.memberships.filter((item) => item.kind !== membership.kind || item.source !== "paid");
        user.memberships.push({
          id: randomUUID(),
          kind: membership.kind,
          startsAt: startsAt.toISOString(),
          expiresAt,
          autoRenew: membership.autoRenew,
          source: "paid",
        });
      } else if (credits) {
        user.credits += credits;
        this.database.transactions.push({
          id: randomUUID(),
          userId: user.id,
          type: "credit",
          amount: credits,
          action: `stripe.${input.lookupKey}`,
          createdAt: this.now().toISOString(),
          idempotencyKey,
        });
      } else {
        throw publicError("UNKNOWN_STRIPE_PRICE", "The Stripe price lookup key is not supported.", 422);
      }
      this.database.idempotency[idempotencyKey] = { transactionId: input.eventId, response: { applied: true } };
    });
  }

  private snapshotForUser(user: UserRecord | null): AccountSnapshot {
    if (!user) {
      return { featureEnabled: this.featureEnabled, authenticated: false, user: null, wallet: null, gameResults: [], memberships: [], collector: { status: "none", badge: null, expiresAt: null }, entitlements: { basicWorkspace: true, standardNumberGeneration: true } };
    }
    const current = this.now().getTime();
    const memberships = user.memberships.map((membership) => ({ ...membership, active: !membership.expiresAt || Date.parse(membership.expiresAt) > current }));
    const collector = memberships.find((membership) => membership.kind === "collector-starter");
    const paidActive = memberships.some((membership) => membership.active && membership.source === "paid");
    const collectorActive = Boolean(collector?.active);
    const memberActive = collectorActive || paidActive;
    const entitlements: Record<string, boolean> = {};
    for (const [key, config] of Object.entries(BEAT2LOTTO_FEATURES)) {
      entitlements[key] = config.access === "free" || (config.access === "membership" && memberActive) || (config.access === "collector" && collectorActive) || config.access === "credits";
    }
    return {
      featureEnabled: this.featureEnabled,
      authenticated: true,
      user: { id: user.id, email: user.email, displayName: user.displayName },
      wallet: { balance: user.credits, verifiedAt: this.now().toISOString() },
      gameResults: this.database.transactions
        .filter((transaction) => transaction.userId === user.id && transaction.type === "credit" && transaction.action === "game.reward.result")
        .slice(-8)
        .reverse()
        .map((transaction) => ({
          id: transaction.id,
          gameId: transaction.context?.gameId === "fighter" ? "fighter" as const : "shadow_ops" as const,
          gameTitle: String(transaction.context?.gameTitle || "LottoMind Game"),
          outcome: String(transaction.context?.outcome || "Completed"),
          creditsAwarded: transaction.amount,
          completedAt: transaction.createdAt,
        })),
      memberships,
      collector: {
        status: collector ? (collector.active ? "active" : "expired") : "none",
        badge: user.badges.includes(COLLECTOR_BADGE) ? COLLECTOR_BADGE : null,
        expiresAt: collector?.expiresAt || null,
      },
      entitlements,
    };
  }

  async provisionCollectible(input: { code: string; sku?: string; series?: string; status?: CollectibleInventoryStatus; expiresAt?: string | null }): Promise<void> {
    if (!input.code.trim()) throw publicError("INVALID_CODE", "A collectible code is required.");
    await this.mutate(() => {
      const codeHash = this.hashCollectible(input.code);
      if (this.database.collectibles.some((item) => item.codeHash === codeHash)) throw publicError("CODE_EXISTS", "That collectible code is already provisioned.", 409);
      this.database.collectibles.push({
        codeHash,
        sku: input.sku || "lottomind-keychain-series-01",
        series: input.series || "Vault Guardian Series 01",
        status: input.status || "active",
        createdAt: this.now().toISOString(),
        expiresAt: input.expiresAt || null,
      });
    });
  }

  async claimCollectible(token: string, code: string): Promise<{ snapshot: AccountSnapshot; membershipExpiresAt: string; creditsAdded: number }> {
    return this.mutate(() => {
      if (!this.featureEnabled) throw publicError("FEATURE_DISABLED", "Collector Access is not available.", 404);
      const user = this.userForToken(token);
      if (!user) throw publicError("AUTH_REQUIRED", "Sign in before redeeming a collectible.", 401);
      const collectible = this.database.collectibles.find((item) => item.codeHash === this.hashCollectible(code));
      if (!collectible) throw publicError("INVALID_CODE", "This collectible code could not be verified.", 404);
      if (collectible.redeemedBy) throw publicError("ALREADY_REDEEMED", "This collectible code has already been redeemed.", 409);
      if (collectible.status === "inactive") throw publicError("INACTIVE_INVENTORY", "This collectible has not been activated for redemption.", 409);
      if (collectible.status === "disabled") throw publicError("CODE_DISABLED", "This collectible code is unavailable. Contact support.", 409);
      if (collectible.expiresAt && Date.parse(collectible.expiresAt) <= this.now().getTime()) throw publicError("CODE_EXPIRED", "This collectible code has expired.", 410);

      const current = this.now();
      const expiresAt = addDays(current, COLLECTOR_DAYS);
      collectible.redeemedBy = user.id;
      collectible.redeemedAt = current.toISOString();
      user.credits += COLLECTOR_CREDITS;
      if (!user.badges.includes(COLLECTOR_BADGE)) user.badges.push(COLLECTOR_BADGE);
      user.memberships = user.memberships.filter((membership) => membership.kind !== "collector-starter");
      user.memberships.push({ id: randomUUID(), kind: "collector-starter", startsAt: current.toISOString(), expiresAt, autoRenew: false, source: "collectible" });
      this.database.transactions.push({ id: randomUUID(), userId: user.id, type: "credit", amount: COLLECTOR_CREDITS, action: "collectible.series-01-redemption", createdAt: current.toISOString(), idempotencyKey: `redeem:${collectible.codeHash}` });
      return { snapshot: this.snapshotForUser(user), membershipExpiresAt: expiresAt, creditsAdded: COLLECTOR_CREDITS };
    });
  }

  async spendCredits(token: string, input: { action: string; idempotencyKey: string; context?: Record<string, string | number | boolean | null> }): Promise<{ transactionId: string; balance: number; amount: number; refundToken: string; duplicate: boolean }> {
    return this.mutate(() => {
      if (!this.featureEnabled) throw publicError("FEATURE_DISABLED", "Premium credit actions are not available.", 404);
      const user = this.userForToken(token);
      if (!user) throw publicError("AUTH_REQUIRED", "Sign in before using Lotto Credits.", 401);
      const amount = BEAT2LOTTO_CREDIT_ACTIONS[input.action as Beat2LottoCreditAction];
      if (!amount) throw publicError("UNKNOWN_ACTION", "This credit action is not available.", 404);
      if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(input.idempotencyKey)) throw publicError("INVALID_IDEMPOTENCY_KEY", "A valid idempotency key is required.");
      const lookup = `${user.id}:${input.idempotencyKey}`;
      const previous = this.database.idempotency[lookup]?.response as { transactionId: string; balance: number; amount: number; refundToken: string } | undefined;
      if (previous) return { ...previous, duplicate: true };
      const recent = this.database.transactions.filter((transaction) => transaction.userId === user.id && transaction.type === "debit" && Date.parse(transaction.createdAt) > this.now().getTime() - 60_000).length;
      if (recent >= 12) throw publicError("RATE_LIMITED", "Please wait before starting another premium action.", 429);
      if (user.credits < amount) throw publicError("INSUFFICIENT_CREDITS", "Not enough Lotto Credits for this action.", 402);
      user.credits -= amount;
      const refundToken = randomBytes(24).toString("base64url");
      const transaction: LedgerTransaction = {
        id: randomUUID(),
        userId: user.id,
        type: "debit",
        amount,
        action: input.action,
        createdAt: this.now().toISOString(),
        idempotencyKey: input.idempotencyKey,
        refundAuthorizationHash: createHash("sha256").update(refundToken).digest("hex"),
        refundableUntil: new Date(this.now().getTime() + 2 * 60_000).toISOString(),
        context: input.context,
      };
      this.database.transactions.push(transaction);
      const response = { transactionId: transaction.id, balance: user.credits, amount, refundToken };
      this.database.idempotency[lookup] = { transactionId: transaction.id, response };
      return { ...response, duplicate: false };
    });
  }

  async refundCredits(token: string, input: { transactionId: string; idempotencyKey: string; refundToken: string }): Promise<{ balance: number; amount: number; duplicate: boolean }> {
    return this.mutate(() => {
      const user = this.userForToken(token);
      if (!user) throw publicError("AUTH_REQUIRED", "Sign in before requesting a refund.", 401);
      const debit = this.database.transactions.find((transaction) => transaction.id === input.transactionId && transaction.userId === user.id && transaction.type === "debit");
      if (!debit) throw publicError("TRANSACTION_NOT_FOUND", "The original credit transaction could not be found.", 404);
      const existing = this.database.transactions.find((transaction) => transaction.relatedTransactionId === debit.id && transaction.type === "refund");
      if (existing) return { balance: user.credits, amount: existing.amount, duplicate: true };
      if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(input.idempotencyKey)) throw publicError("INVALID_IDEMPOTENCY_KEY", "A valid idempotency key is required.");
      if (!debit.refundAuthorizationHash || !debit.refundableUntil || Date.parse(debit.refundableUntil) < this.now().getTime()) {
        throw publicError("REFUND_WINDOW_CLOSED", "The automatic refund window has closed.", 409);
      }
      const supplied = createHash("sha256").update(input.refundToken || "").digest();
      const expected = Buffer.from(debit.refundAuthorizationHash, "hex");
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw publicError("REFUND_NOT_AUTHORIZED", "The automatic refund could not be authorized.", 403);
      user.credits += debit.amount;
      this.database.transactions.push({ id: randomUUID(), userId: user.id, type: "refund", amount: debit.amount, action: `${debit.action}.refund`, createdAt: this.now().toISOString(), idempotencyKey: input.idempotencyKey, relatedTransactionId: debit.id });
      return { balance: user.credits, amount: debit.amount, duplicate: false };
    });
  }

  async grantGameReward(token: string, input: {
    gameId: "shadow_ops" | "fighter";
    gameTitle: string;
    outcome: string;
    milestones: GameRewardMilestone[];
    idempotencyKey: string;
  }): Promise<{ transactionId: string; balance: number; amount: number; duplicate: boolean }> {
    return this.mutate(() => {
      const user = this.userForToken(token);
      if (!user) throw publicError("AUTH_REQUIRED", "Sign in before earning Lotto Credits from game results.", 401);
      if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(input.idempotencyKey)) throw publicError("INVALID_IDEMPOTENCY_KEY", "A valid game result key is required.");
      const lookup = `${user.id}:game:${input.idempotencyKey}`;
      const previous = this.database.idempotency[lookup]?.response as { transactionId: string; balance: number; amount: number } | undefined;
      if (previous) return { ...previous, duplicate: true };

      const milestones = [...new Set(input.milestones)].filter((milestone) => milestone in GAME_REWARD_AMOUNTS);
      if (!milestones.length) throw publicError("INVALID_STATE_TRANSITION", "No verified reward milestone was completed.", 422);
      const amount = milestones.reduce((total, milestone) => total + GAME_REWARD_AMOUNTS[milestone], 0);
      const today = this.now().toISOString().slice(0, 10);
      const gameCreditsToday = this.database.transactions
        .filter((transaction) => transaction.userId === user.id && transaction.type === "credit" && transaction.action === "game.reward.result" && transaction.createdAt.startsWith(today) && transaction.context?.gameId === input.gameId)
        .reduce((total, transaction) => total + transaction.amount, 0);
      const globalGameCreditsToday = this.database.transactions
        .filter((transaction) => transaction.userId === user.id && transaction.type === "credit" && transaction.action === "game.reward.result" && transaction.createdAt.startsWith(today))
        .reduce((total, transaction) => total + transaction.amount, 0);
      const gameCap = input.gameId === "shadow_ops" ? 20 : 9;
      if (gameCreditsToday + amount > gameCap || globalGameCreditsToday + amount > 25) {
        throw publicError("DAILY_REWARD_CAP_REACHED", "The daily game reward limit has been reached.", 429);
      }

      const milestoneCounts = this.database.transactions
        .filter((transaction) => transaction.userId === user.id && transaction.type === "credit" && transaction.action === "game.reward.result" && transaction.createdAt.startsWith(today))
        .flatMap((transaction) => String(transaction.context?.milestones || "").split(",").filter(Boolean));
      const milestoneLimits: Record<GameRewardMilestone, number> = {
        "shadow.campaign_completed": 1,
        "fighter.match_completed": 3,
        "fighter.match_win": 2,
      };
      if (milestones.some((milestone) => milestoneCounts.filter((value) => value === milestone).length >= milestoneLimits[milestone])) {
        throw publicError("DAILY_REWARD_CAP_REACHED", "This game milestone has reached its daily reward limit.", 429);
      }

      user.credits += amount;
      const transaction: LedgerTransaction = {
        id: randomUUID(),
        userId: user.id,
        type: "credit",
        amount,
        action: "game.reward.result",
        createdAt: this.now().toISOString(),
        idempotencyKey: input.idempotencyKey,
        context: {
          gameId: input.gameId,
          gameTitle: input.gameTitle.slice(0, 80),
          outcome: input.outcome.slice(0, 80),
          milestones: milestones.join(","),
        },
      };
      this.database.transactions.push(transaction);
      const response = { transactionId: transaction.id, balance: user.credits, amount };
      this.database.idempotency[lookup] = { transactionId: transaction.id, response };
      return { ...response, duplicate: false };
    });
  }

  async addPaidMembershipForTest(token: string, kind: "gold" | "ultra" | "vault", expiresAt: string | null): Promise<void> {
    await this.mutate(() => {
      const user = this.userForToken(token);
      if (!user) throw publicError("AUTH_REQUIRED", "Authentication required.", 401);
      const membership: MembershipRecord = { id: randomUUID(), kind, startsAt: this.now().toISOString(), expiresAt, autoRenew: true, source: "paid" };
      user.memberships.push(membership);
    });
  }

  async recordAnalytics(token: string, event: string, metadata?: Record<string, string | number | boolean | null>): Promise<void> {
    const allowed = new Set(["collector_panel_viewed", "collector_redeem_started", "collector_redeem_success", "collector_redeem_failed", "beat2lotto_member_feature_opened", "credit_action_confirmed", "credit_action_completed", "credit_action_failed", "collector_pack_used"]);
    if (!allowed.has(event)) return;
    await this.mutate(() => {
      const user = this.userForToken(token);
      const cleanMetadata = Object.fromEntries(Object.entries(metadata || {}).filter(([key, value]) => !/code|token|audio|beat/i.test(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 12));
      this.database.analytics.push({ event, userId: user?.id, createdAt: this.now().toISOString(), metadata: cleanMetadata });
      this.database.analytics = this.database.analytics.slice(-2000);
    });
  }
}
