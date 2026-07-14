# Stripe test-mode setup

The site is wired to Stripe Checkout through the local Node server. GitHub Pages can host the static site, but the `news-hub/server` application must be deployed to a Node-compatible host before checkout and account sessions can work in production.

## 1. Create test products and prices

In the Stripe Dashboard, turn on **Test mode** and create these lookup keys:

- `gold_monthly`
- `gold_yearly`
- `ultra_monthly`
- `ultra_yearly`
- `vault_founder_once`
- `vault_yearly`
- `vault_lifetime_once`
- `credits_starter_once`
- `credits_studio_once`
- `credits_vault_once`

## 2. Configure the local server

Copy `news-hub/.env.example` to `news-hub/.env.local` and add only test-mode values:

```env
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_PRICE_GOLD_MONTHLY=price_REPLACE_ME
STRIPE_PRICE_GOLD_YEARLY=price_REPLACE_ME
STRIPE_PRICE_ULTRA_MONTHLY=price_REPLACE_ME
STRIPE_PRICE_ULTRA_YEARLY=price_REPLACE_ME
STRIPE_PRICE_VAULT_FOUNDER_ONCE=price_REPLACE_ME
STRIPE_PRICE_VAULT_YEARLY=price_REPLACE_ME
STRIPE_PRICE_VAULT_LIFETIME_ONCE=price_REPLACE_ME
STRIPE_PRICE_CREDITS_STARTER_ONCE=price_REPLACE_ME
STRIPE_PRICE_CREDITS_STUDIO_ONCE=price_REPLACE_ME
STRIPE_PRICE_CREDITS_VAULT_ONCE=price_REPLACE_ME
```

Never place `sk_test_`, `sk_live_`, or webhook secrets in an HTML or browser JavaScript file. Do not commit `.env.local`.

## 3. Configure the webhook

For local testing with the Stripe CLI:

```powershell
stripe listen --forward-to http://127.0.0.1:8142/api/billing/webhook
```

Subscribe the deployed webhook endpoint to `checkout.session.completed`.

## 4. Test checkout

1. Sign in through Collector Access on `memberships.html`.
2. Choose a membership or LottoCredits pack.
3. Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any CVC.
4. Return to the membership page and verify the wallet or membership state.

The server rejects live secret keys in this phase and keeps frontend code free of Stripe secrets.
