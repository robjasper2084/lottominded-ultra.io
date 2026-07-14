import { Router, type Request, type Response } from "express";
import { BEAT2LOTTO_CREDIT_ACTIONS, BEAT2LOTTO_FEATURES } from "./feature-config";
import { AccountLedgerStore } from "./store";

const COOKIE_NAME = "lottomind_session";

function parseCookies(request: Request): Record<string, string> {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function sessionToken(request: Request): string {
  return parseCookies(request)[COOKIE_NAME] || "";
}

function setSessionCookie(response: Response, token: string, secure: boolean): void {
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86_400}${secure ? "; Secure" : ""}`);
}

function clearSessionCookie(response: Response, secure: boolean): void {
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
}

function text(value: unknown, maximum = 254): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function context(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry === null || ["string", "number", "boolean"].includes(typeof entry)).slice(0, 20)) as Record<string, string | number | boolean | null>;
}

function sendError(response: Response, error: unknown): void {
  const typed = error as Error & { code?: string; status?: number };
  response.status(typed.status || 500).json({ error: { code: typed.code || "ACCOUNT_SERVICE_ERROR", message: typed.status && typed.status < 500 ? typed.message : "The account service is temporarily unavailable." } });
}

export function createAccountRouter(store: AccountLedgerStore, secureCookie = false): Router {
  const router = Router();

  router.get("/account/snapshot", async (request, response) => {
    try {
      response.setHeader("Cache-Control", "no-store");
      response.json(await store.snapshot(sessionToken(request)));
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/account/session", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      response.setHeader("Cache-Control", "no-store");
      response.json({ authenticated: snapshot.authenticated, user: snapshot.user });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/account/wallet", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      if (!snapshot.authenticated) return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to view the wallet." } });
      response.setHeader("Cache-Control", "no-store");
      response.json(snapshot.wallet);
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/account/memberships", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      if (!snapshot.authenticated) return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to view memberships." } });
      response.setHeader("Cache-Control", "no-store");
      response.json({ memberships: snapshot.memberships, collector: snapshot.collector });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/entitlements/beat2lotto", async (request, response) => {
    try {
      const snapshot = await store.snapshot(sessionToken(request));
      response.setHeader("Cache-Control", "no-store");
      response.json({ featureEnabled: snapshot.featureEnabled, entitlements: snapshot.entitlements, features: BEAT2LOTTO_FEATURES, creditActions: BEAT2LOTTO_CREDIT_ACTIONS });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/auth/register", async (request, response) => {
    try {
      const result = await store.register({ email: text(request.body?.email), password: text(request.body?.password, 512), displayName: text(request.body?.displayName, 80) });
      setSessionCookie(response, result.token, secureCookie);
      response.status(201).json(result.snapshot);
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/auth/login", async (request, response) => {
    try {
      const result = await store.login({ email: text(request.body?.email), password: text(request.body?.password, 512) });
      setSessionCookie(response, result.token, secureCookie);
      response.json(result.snapshot);
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/auth/logout", async (request, response) => {
    try {
      const token = sessionToken(request);
      if (token) await store.logout(token);
      clearSessionCookie(response, secureCookie);
      response.status(204).end();
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/redemption/claim", async (request, response) => {
    try {
      const result = await store.claimCollectible(sessionToken(request), text(request.body?.code, 96));
      response.json(result);
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/credits/spend", async (request, response) => {
    try {
      response.json(await store.spendCredits(sessionToken(request), { action: text(request.body?.action, 100), idempotencyKey: text(request.body?.idempotencyKey, 128), context: context(request.body?.context) }));
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/credits/refund", async (request, response) => {
    try {
      response.json(await store.refundCredits(sessionToken(request), { transactionId: text(request.body?.transactionId, 100), idempotencyKey: text(request.body?.idempotencyKey, 128), refundToken: text(request.body?.refundToken, 128) }));
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/analytics", async (request, response) => {
    try {
      await store.recordAnalytics(sessionToken(request), text(request.body?.event, 80), context(request.body?.metadata));
      response.status(204).end();
    } catch (error) {
      sendError(response, error);
    }
  });

  return router;
}
