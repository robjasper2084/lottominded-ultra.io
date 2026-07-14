import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AccountLedgerStore } from "./store";

async function fixture(options: { featureEnabled?: boolean; now?: Date } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "lottomind-account-"));
  let current = options.now || new Date("2026-07-10T16:00:00.000Z");
  const store = new AccountLedgerStore(
    join(directory, "ledger.json"),
    "unit-test-redemption-pepper",
    options.featureEnabled !== false,
    () => new Date(current),
  );
  return {
    store,
    setNow(value: string) { current = new Date(value); },
    cleanup() { return rm(directory, { recursive: true, force: true }); },
  };
}

async function errorCode(operation: () => Promise<unknown>): Promise<string> {
  try {
    await operation();
    assert.fail("Expected operation to reject");
  } catch (error) {
    return String((error as Error & { code?: string }).code || "");
  }
}

test("signed-out users get only free entitlements", async () => {
  const context = await fixture();
  try {
    const snapshot = await context.store.snapshot();
    assert.equal(snapshot.authenticated, false);
    assert.equal(snapshot.wallet, null);
    assert.equal(snapshot.entitlements.basicWorkspace, true);
    assert.equal(snapshot.entitlements.standardNumberGeneration, true);
  } finally {
    await context.cleanup();
  }
});

test("valid collectible redemption grants exactly 150 credits and 30 non-renewing days", async () => {
  const context = await fixture();
  try {
    await context.store.provisionCollectible({ code: "VG01-VALID-0001" });
    const registered = await context.store.register({ email: "collector@example.com", password: "correct-horse-battery" });
    const result = await context.store.claimCollectible(registered.token, "vg01-valid-0001");
    assert.equal(result.creditsAdded, 150);
    assert.equal(result.snapshot.wallet?.balance, 150);
    assert.equal(result.snapshot.collector.status, "active");
    assert.equal(result.snapshot.collector.badge, "vault-guardian-series-01");
    const collector = result.snapshot.memberships.find((membership) => membership.kind === "collector-starter");
    assert.equal(collector?.autoRenew, false);
    assert.equal(result.membershipExpiresAt, "2026-08-09T16:00:00.000Z");
  } finally {
    await context.cleanup();
  }
});

test("invalid, inactive, disabled, expired, and redeemed codes have distinct safe errors", async () => {
  const context = await fixture();
  try {
    const first = await context.store.register({ email: "one@example.com", password: "correct-horse-one" });
    const second = await context.store.register({ email: "two@example.com", password: "correct-horse-two" });
    await context.store.provisionCollectible({ code: "INACTIVE-0001", status: "inactive" });
    await context.store.provisionCollectible({ code: "DISABLED-0001", status: "disabled" });
    await context.store.provisionCollectible({ code: "EXPIRED-0001", expiresAt: "2026-07-09T16:00:00.000Z" });
    await context.store.provisionCollectible({ code: "USED-CODE-0001" });
    await context.store.claimCollectible(first.token, "USED-CODE-0001");
    assert.equal(await errorCode(() => context.store.claimCollectible(second.token, "UNKNOWN-0001")), "INVALID_CODE");
    assert.equal(await errorCode(() => context.store.claimCollectible(second.token, "INACTIVE-0001")), "INACTIVE_INVENTORY");
    assert.equal(await errorCode(() => context.store.claimCollectible(second.token, "DISABLED-0001")), "CODE_DISABLED");
    assert.equal(await errorCode(() => context.store.claimCollectible(second.token, "EXPIRED-0001")), "CODE_EXPIRED");
    assert.equal(await errorCode(() => context.store.claimCollectible(second.token, "USED-CODE-0001")), "ALREADY_REDEEMED");
  } finally {
    await context.cleanup();
  }
});

test("server-priced spends are idempotent and refundable once", async () => {
  const context = await fixture();
  try {
    await context.store.provisionCollectible({ code: "WALLET-0001" });
    const registered = await context.store.register({ email: "wallet@example.com", password: "correct-horse-wallet" });
    await context.store.claimCollectible(registered.token, "WALLET-0001");
    const input = { action: "beat2lotto.premium-number-conversion", idempotencyKey: "premium:request-0001" };
    const first = await context.store.spendCredits(registered.token, input);
    const duplicate = await context.store.spendCredits(registered.token, input);
    assert.equal(first.amount, 10);
    assert.equal(first.balance, 140);
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.transactionId, first.transactionId);
    assert.equal((await context.store.snapshot(registered.token)).wallet?.balance, 140);
    assert.equal(await errorCode(() => context.store.refundCredits(registered.token, { transactionId: first.transactionId, idempotencyKey: "refund:unauthorized-0001", refundToken: "not-the-token" })), "REFUND_NOT_AUTHORIZED");
    const refund = await context.store.refundCredits(registered.token, { transactionId: first.transactionId, idempotencyKey: "refund:request-0001", refundToken: first.refundToken });
    const duplicateRefund = await context.store.refundCredits(registered.token, { transactionId: first.transactionId, idempotencyKey: "refund:request-0002", refundToken: first.refundToken });
    assert.equal(refund.balance, 150);
    assert.equal(duplicateRefund.duplicate, true);
    assert.equal((await context.store.snapshot(registered.token)).wallet?.balance, 150);
  } finally {
    await context.cleanup();
  }
});

test("verified game results grant fixed credits and appear in the wallet snapshot", async () => {
  const context = await fixture();
  try {
    const registered = await context.store.register({ email: "player@example.com", password: "correct-horse-player" });
    const first = await context.store.grantGameReward(registered.token, {
      gameId: "fighter",
      gameTitle: "GOTHTECHNOLOGY",
      outcome: "Match won",
      milestones: ["fighter.match_completed", "fighter.match_win"],
      idempotencyKey: "fighter:match-0001",
    });
    const duplicate = await context.store.grantGameReward(registered.token, {
      gameId: "fighter",
      gameTitle: "GOTHTECHNOLOGY",
      outcome: "Match won",
      milestones: ["fighter.match_completed", "fighter.match_win"],
      idempotencyKey: "fighter:match-0001",
    });
    const snapshot = await context.store.snapshot(registered.token);
    assert.equal(first.amount, 3);
    assert.equal(first.balance, 3);
    assert.equal(duplicate.duplicate, true);
    assert.equal(snapshot.wallet?.balance, 3);
    assert.equal(snapshot.gameResults[0]?.gameTitle, "GOTHTECHNOLOGY");
    assert.equal(snapshot.gameResults[0]?.creditsAwarded, 3);
  } finally {
    await context.cleanup();
  }
});

test("game rewards enforce per-milestone daily limits", async () => {
  const context = await fixture();
  try {
    const registered = await context.store.register({ email: "cap@example.com", password: "correct-horse-cap" });
    await context.store.grantGameReward(registered.token, {
      gameId: "shadow_ops",
      gameTitle: "Shadow Ops Canvas",
      outcome: "Campaign completed",
      milestones: ["shadow.campaign_completed"],
      idempotencyKey: "shadow:campaign-0001",
    });
    const code = await errorCode(() => context.store.grantGameReward(registered.token, {
      gameId: "shadow_ops",
      gameTitle: "Shadow Ops Canvas",
      outcome: "Campaign completed",
      milestones: ["shadow.campaign_completed"],
      idempotencyKey: "shadow:campaign-0002",
    }));
    assert.equal(code, "DAILY_REWARD_CAP_REACHED");
  } finally {
    await context.cleanup();
  }
});

test("insufficient funds are rejected without mutating the wallet", async () => {
  const context = await fixture();
  try {
    const registered = await context.store.register({ email: "free@example.com", password: "correct-horse-free" });
    const code = await errorCode(() => context.store.spendCredits(registered.token, {
      action: "beat2lotto.premium-number-conversion",
      idempotencyKey: "premium:insufficient-0001",
    }));
    assert.equal(code, "INSUFFICIENT_CREDITS");
    assert.equal((await context.store.snapshot(registered.token)).wallet?.balance, 0);
  } finally {
    await context.cleanup();
  }
});

test("collector expiration does not remove a paid membership or the remaining wallet", async () => {
  const context = await fixture();
  try {
    await context.store.provisionCollectible({ code: "PAID-PLUS-COLLECTOR" });
    const registered = await context.store.register({ email: "paid@example.com", password: "correct-horse-paid" });
    await context.store.addPaidMembershipForTest(registered.token, "ultra", null);
    await context.store.claimCollectible(registered.token, "PAID-PLUS-COLLECTOR");
    context.setNow("2026-08-10T16:00:00.000Z");
    const refreshed = await context.store.login({ email: "paid@example.com", password: "correct-horse-paid" });
    const snapshot = await context.store.snapshot(refreshed.token);
    assert.equal(snapshot.collector.status, "expired");
    assert.equal(snapshot.wallet?.balance, 150);
    assert.equal(snapshot.memberships.some((membership) => membership.kind === "ultra" && membership.active), true);
    assert.equal(snapshot.entitlements.additionalSavedDrops, true);
  } finally {
    await context.cleanup();
  }
});

test("feature flag disables redemption and premium spending", async () => {
  const context = await fixture({ featureEnabled: false });
  try {
    await context.store.provisionCollectible({ code: "FLAG-OFF-0001" });
    const registered = await context.store.register({ email: "flag@example.com", password: "correct-horse-flag" });
    assert.equal((await context.store.snapshot(registered.token)).featureEnabled, false);
    assert.equal(await errorCode(() => context.store.claimCollectible(registered.token, "FLAG-OFF-0001")), "FEATURE_DISABLED");
    assert.equal(await errorCode(() => context.store.spendCredits(registered.token, {
      action: "beat2lotto.premium-number-conversion",
      idempotencyKey: "premium:flag-off-0001",
    })), "FEATURE_DISABLED");
  } finally {
    await context.cleanup();
  }
});
