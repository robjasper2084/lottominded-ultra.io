# Static Wave Leaderboard Endpoint

The game runs safely without a backend and labels the Community board as offline.

To enable global scores, set the `static-wave-leaderboard-endpoint` meta tag in `index.html` to an HTTPS endpoint that supports:

- `GET ?limit=5` returning either an array or `{ "scores": [...] }`
- `POST` accepting JSON with `name`, `score`, `players`, `level`, `mode`, `grade`, and `timestamp`

The service must validate scores server-side, rate-limit submissions, return CORS headers for the GitHub Pages origin, and never expose a privileged write key in browser code.
