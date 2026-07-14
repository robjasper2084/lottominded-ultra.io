export type CollectibleInventoryStatus = "active" | "inactive" | "disabled";
export type MembershipKind = "collector-starter" | "gold" | "ultra" | "vault";

export interface MembershipRecord {
  id: string;
  kind: MembershipKind;
  startsAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  source: "collectible" | "paid" | "admin";
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit" | "refund";
  amount: number;
  action: string;
  createdAt: string;
  idempotencyKey: string;
  relatedTransactionId?: string;
  refundAuthorizationHash?: string;
  refundableUntil?: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  credits: number;
  memberships: MembershipRecord[];
  badges: string[];
  stripeCustomerId?: string;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface CollectibleRecord {
  codeHash: string;
  sku: string;
  series: string;
  status: CollectibleInventoryStatus;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt?: string;
  redeemedBy?: string;
}

export interface AccountDatabase {
  version: 1;
  users: UserRecord[];
  sessions: SessionRecord[];
  collectibles: CollectibleRecord[];
  transactions: LedgerTransaction[];
  idempotency: Record<string, { transactionId: string; response: unknown }>;
  analytics: Array<{ event: string; userId?: string; createdAt: string; metadata?: Record<string, string | number | boolean | null> }>;
}

export interface AccountSnapshot {
  featureEnabled: boolean;
  authenticated: boolean;
  user: null | { id: string; email: string; displayName: string };
  wallet: { balance: number; verifiedAt: string } | null;
  gameResults: Array<{
    id: string;
    gameId: "shadow_ops" | "fighter";
    gameTitle: string;
    outcome: string;
    creditsAwarded: number;
    completedAt: string;
  }>;
  memberships: Array<MembershipRecord & { active: boolean }>;
  collector: {
    status: "none" | "active" | "expired";
    badge: string | null;
    expiresAt: string | null;
  };
  entitlements: Record<string, boolean>;
}
