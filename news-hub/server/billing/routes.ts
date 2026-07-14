import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type Request, type RequestHandler, type Response } from "express";
import type { AccountLedgerStore } from "../account/store";

type BillingPlan = {
  lookupKey: string;
  envKey: string;
  mode: "payment" | "subscription";
};

const PLANS: BillingPlan[] = [
  { lookupKey: "gold_monthly", envKey: "STRIPE_PRICE_GOLD_MONTHLY", mode: "subscription" },
  { lookupKey: "gold_yearly", envKey: "STRIPE_PRICE_GOLD_YEARLY", mode: "subscription" },
  { lookupKey: "ultra_monthly", envKey: "STRIPE_PRICE_ULTRA_MONTHLY", mode: "subscription" },
  { lookupKey: "ultra_yearly", envKey: "STRIPE_PRICE_ULTRA_YEARLY", mode: "subscription" },
  { lookupKey: "vault_founder_once", envKey: "STRIPE_PRICE_VAULT_FOUNDER_ONCE", mode: "payment" },
  { lookupKey: "vault_yearly", envKey: "STRIPE_PRICE_VAULT_YEARLY", mode: "subscription" },
  { lookupKey: "vault_lifetime_once", envKey: "STRIPE_PRICE_VAULT_LIFETIME_ONCE", mode: "payment" },
  { lookupKey: "credits_starter_once", envKey: "STRIPE_PRICE_CREDITS_STARTER_ONCE", mode: "payment" },
  { lookupKey: "credits_studio_once", envKey: "STRIPE_PRICE_CREDITS_STUDIO_ONCE", mode: "payment" },
  { lookupKey: "credits_vault_once", envKey: "STRIPE_PRICE_CREDITS_VAULT_ONCE", mode: "payment" },
];

function cookies(request: Request): Record<string, string> {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function publicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${request.protocol}://${request.get("host")}`;
}

async function stripeRequest(path: string, secret: string, form: URLSearchParams): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: controller.signal,
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      const message = typeof (payload.error as { message?: unknown } | undefined)?.message === "string"
        ? String((payload.error as { message: string }).message)
        : "Stripe rejected the request.";
      throw Object.assign(new Error(message), { status: 502 });
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function verifyStripeSignature(payload: Buffer, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2) as [string, string]));
  const timestamp = Number(parts.t);
  const signature = parts.v1 || "";
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload.toString("utf8")}`).digest();
  const supplied = Buffer.from(signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createBillingRoutes(store: AccountLedgerStore): { router: Router; webhook: RequestHandler } {
  const router = Router();
  const secret = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  const testMode = secret.startsWith("sk_test_");
  const planMap = new Map(PLANS.map((plan) => [plan.lookupKey, plan]));

  router.get("/config", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json({
      enabled: testMode,
      mode: "test",
      plans: PLANS.map((plan) => ({ lookupKey: plan.lookupKey, available: Boolean(process.env[plan.envKey]) })),
      message: testMode ? "Stripe test mode is ready." : "Add an sk_test_ key on the server to enable test checkout.",
    });
  });

  router.post("/checkout", async (request, response) => {
    try {
      if (!testMode) return response.status(503).json({ error: { code: "STRIPE_TEST_MODE_REQUIRED", message: "Stripe test mode is not configured." } });
      const identity = await store.billingIdentity(cookies(request).lottomind_session || "");
      if (!identity) return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in before starting checkout." } });
      const lookupKey = typeof request.body?.lookupKey === "string" ? request.body.lookupKey : "";
      const plan = planMap.get(lookupKey);
      const priceId = plan ? process.env[plan.envKey]?.trim() : "";
      if (!plan || !priceId?.startsWith("price_")) return response.status(422).json({ error: { code: "PRICE_NOT_CONFIGURED", message: "That test price has not been configured yet." } });

      const origin = publicOrigin(request);
      const form = new URLSearchParams({
        mode: plan.mode,
        success_url: `${origin}/memberships.html?checkout=success#membership-plans`,
        cancel_url: `${origin}/memberships.html?checkout=cancelled#membership-plans`,
        client_reference_id: identity.id,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "metadata[userId]": identity.id,
        "metadata[lookupKey]": lookupKey,
      });
      if (identity.stripeCustomerId) form.set("customer", identity.stripeCustomerId);
      else form.set("customer_email", identity.email);
      const session = await stripeRequest("checkout/sessions", secret, form);
      const url = typeof session.url === "string" ? session.url : "";
      if (!url.startsWith("https://checkout.stripe.com/")) throw new Error("Stripe returned no checkout URL.");
      response.json({ url });
    } catch (error) {
      response.status(Number((error as { status?: number }).status || 500)).json({ error: { code: "STRIPE_CHECKOUT_FAILED", message: error instanceof Error ? error.message : "Stripe checkout failed." } });
    }
  });

  router.post("/portal", async (request, response) => {
    try {
      if (!testMode) return response.status(503).json({ error: { code: "STRIPE_TEST_MODE_REQUIRED", message: "Stripe test mode is not configured." } });
      const identity = await store.billingIdentity(cookies(request).lottomind_session || "");
      if (!identity) return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in before opening billing." } });
      if (!identity.stripeCustomerId) return response.status(409).json({ error: { code: "NO_STRIPE_CUSTOMER", message: "Complete a test checkout before opening the billing portal." } });
      const session = await stripeRequest("billing_portal/sessions", secret, new URLSearchParams({
        customer: identity.stripeCustomerId,
        return_url: `${publicOrigin(request)}/memberships.html#membership-plans`,
      }));
      response.json({ url: session.url });
    } catch (error) {
      response.status(Number((error as { status?: number }).status || 500)).json({ error: { code: "STRIPE_PORTAL_FAILED", message: error instanceof Error ? error.message : "The billing portal could not be opened." } });
    }
  });

  const webhook: RequestHandler = async (request, response) => {
    try {
      const payload = Buffer.isBuffer(request.body) ? request.body : Buffer.from("");
      const signature = request.get("stripe-signature") || "";
      if (!webhookSecret || !verifyStripeSignature(payload, signature, webhookSecret)) return response.status(400).send("Invalid Stripe signature");
      const event = JSON.parse(payload.toString("utf8")) as {
        id?: string;
        type?: string;
        data?: { object?: Record<string, unknown> };
      };
      if (event.type === "checkout.session.completed" && event.id && event.data?.object) {
        const session = event.data.object;
        const metadata = session.metadata as Record<string, unknown> | undefined;
        const userId = typeof metadata?.userId === "string" ? metadata.userId : "";
        const lookupKey = typeof metadata?.lookupKey === "string" ? metadata.lookupKey : "";
        const customerId = typeof session.customer === "string" ? session.customer : undefined;
        if (userId && lookupKey) await store.applyStripeCheckout({ userId, lookupKey, customerId, eventId: event.id });
      }
      response.json({ received: true });
    } catch {
      response.status(400).send("Invalid Stripe webhook payload");
    }
  };

  return { router, webhook };
}
