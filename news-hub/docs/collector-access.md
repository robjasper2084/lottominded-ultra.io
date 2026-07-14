# LottoMind Collector Access

## Scope

Collector Access connects the current Beat2Lotto Shadow Ops route and LottoMind Refined to one server-authoritative account, membership, and credit ledger.

The first collectible SKU grants:

- Collector Starter for 30 days
- 150 Lotto Credits
- Vault Guardian Series 01 badge
- No automatic renewal

Basic Beat2Lotto gameplay and standard number generation remain free. Premium number conversion is the first server-priced credit action and costs 10 Lotto Credits.

## Architecture

- `server/account/store.ts`: atomic JSON ledger, hashed sessions, password hashing, collectible inventory, memberships, credits, idempotency, refunds, and safe analytics.
- `server/account/routes.ts`: authenticated JSON endpoints under `/api`.
- `assets/js/lottomind-account-service.js`: shared browser client used by Beat2Lotto and LottoMind Refined.
- `assets/js/beat2lotto-collector-access.js`: accessible Collector Access panel and the parent-to-game credit transaction bridge.
- `redeem.html`: central redemption route.
- `games/shadow-ops-canvas`: free number terminal plus the premium conversion action.

The browser cache is display-only. BroadcastChannel and storage events only request a fresh server snapshot. They never carry authoritative balances or grant entitlements.

## Environment

Set these variables on the Node service:

```text
PORT=8142
NODE_ENV=production
LOTTOMIND_COLLECTIBLE_ACCESS=true
LOTTOMIND_REDEMPTION_PEPPER=<long random secret from your deployment secret manager>
LOTTOMIND_ACCOUNT_DATA_FILE=<durable private path outside the public web root>
```

Never place `LOTTOMIND_REDEMPTION_PEPPER` in frontend code, Git, HTML, or a public static host. In production, Collector Access fails closed if the pepper is missing. The local development server uses a development-only fallback so the interface can be tested without a committed secret.

## Provision inventory

Provision one unique code per activated physical collectible:

```powershell
$env:LOTTOMIND_REDEMPTION_PEPPER = '<same secret used by the service>'
npm.cmd run provision:collectible -- '<unique-code>' active
```

Use `inactive` for inventory that has not been activated and `disabled` for a recalled or blocked item. The plaintext code is HMAC-hashed before storage and is not written to the ledger or analytics.

## Endpoints

- `GET /api/account/snapshot`
- `GET /api/account/session`
- `GET /api/account/wallet`
- `GET /api/account/memberships`
- `GET /api/entitlements/beat2lotto`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/redemption/claim`
- `POST /api/credits/spend`
- `POST /api/credits/refund`
- `POST /api/analytics`

Sessions are HttpOnly, SameSite=Lax cookies. Cross-port requests from the local Refined app at `127.0.0.1:8170` use credentialed CORS to `127.0.0.1:8142`.

## Credit safety

- The server selects the price from `feature-config.ts`; the browser cannot submit an amount.
- Every spend requires an idempotency key.
- Insufficient funds return `INSUFFICIENT_CREDITS` without changing the wallet.
- A failed premium action can refund its associated debit once during a two-minute window using the one-time refund authorization returned with that debit.
- Redemption is one-time and distinguishes invalid, inactive, disabled, expired, and already-redeemed inventory.
- URL parameters such as `?credits=150` are not authoritative and no longer change LottoMind Refined balances.

## Audio isolation

Collector Access adds no sound asset and does not call the game's `initAudio`, recreate its `AudioContext`, restart music, or change volume. The premium terminal button intentionally has no `data-action` attribute, so account refreshes and premium confirmations stay outside the existing game-audio initialization path.

## Static hosting

GitHub Pages can host the UI files but cannot run the Node account service. Before public launch, deploy `news-hub/server/index.ts` to an HTTPS Node host with durable private storage, then set `window.LOTTOMIND_API_BASE_URL` to that service URL. Use `Secure` cookies in production and allow only the exact production origins.

## Tests

Run:

```powershell
npm.cmd test
npx.cmd tsc --noEmit
```

The account tests cover signed-out state, valid grants, invalid inventory states, one-time redemption, idempotent spending, insufficient funds, one-time refunds, paid membership preservation, expiration, and the feature flag.

## Rollback

Fast rollback without reverting unrelated work:

1. Set `LOTTOMIND_COLLECTIBLE_ACCESS=false` and restart the Node service. This hides Collector Access and rejects redemption and premium spend endpoints while leaving free gameplay intact.
2. Restore only the affected files from `C:\Users\digit\Documents\phone\.codex-backups\2026-07-10-collector-access` if a file-level rollback is required.
3. The repository backup pointer is `backup/collector-access-20260710` at `e1be616e8ff7ebbcef34390d3a39204ca3113996`.

Do not use a broad reset in the dirty repository; it contains unrelated user work.
