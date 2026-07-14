# Lottery-rule configuration

All number ranges and draw behavior live in `src/config/lotteryRules.ts`.

Each rule defines:

- `mainCount`, `mainMin`, and `mainMax`
- whether main values must be unique
- whether main values are sorted
- an optional special-ball range, label, and color

`src/services/secureRandom.ts` validates the rule, uses rejection sampling over `crypto.getRandomValues`, and never derives numbers from player behavior, dates, names, scores, dreams, or historic draws.

After editing a rule, run:

```powershell
npm test
```

Invalid or impossible unique configurations throw clear errors rather than silently producing a malformed draw.
