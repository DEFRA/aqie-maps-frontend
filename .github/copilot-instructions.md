# aqie-maps-frontend — Copilot Instructions

Node.js/Hapi frontend service for the Air Quality interactive map.  
Always follow the [JavaScript style guide](.agents/javascript.md) and [Frontend rules](.agents/FRONTEND-RULES.md) when writing code for this repo.

---

## Build / Test commands

```bash
npm run dev               # start server with hot-reload (loads .env automatically)
npm test                  # run Vitest + coverage (min 90%)
npm run lint              # ESLint (neostandard)
npm run format:check      # Prettier check
npm run build:frontend    # Vite production build
docker compose up --build # recommended: starts app + Redis + Floci together
```

Tests are run with `cross-env AWS_EMF_ENVIRONMENT=Local TZ=UTC NODE_ENV=test`.  
Do **not** use `--env-file` manually — the dev script handles this via `--env-file-if-exists=.env`.

---

## Architecture

**Framework**: Hapi (`@hapi/hapi`) — server configured in `src/server/server.js`, started via `src/server/common/helpers/start-server.js`.  
**Templating**: Nunjucks, configured in `src/config/nunjucks/`.  
**Session cache**: Catbox Memory (dev/test) or Catbox Redis (production) — see `src/server/common/helpers/session-cache/cache-engine.js`.  
**HTTP requests to upstreams**: via `undici` — shared HTTP utility in `src/server/common/helpers/http-client.js`.

### Key upstream dependencies

| Config key            | Default                         | Purpose                  |
| --------------------- | ------------------------------- | ------------------------ |
| `aqieBackEnd.url`     | `http://localhost:3001`         | Monitoring stations data |
| `aqieForecastApi.url` | `null` (falls back to back-end) | Forecast data            |

### Route / plugin structure

Routes are Hapi plugins, registered in `src/server/plugins/router.js`.  
Each feature lives in `src/server/routes/[feature-name]/` with `index.js` (plugin) and `controller.js` (handlers).

**API routes are split by upstream service:**

- `src/server/routes/api/monitoring-stations/` — `/api/monitoring-stations` and `/api/monitoring-station-info` → calls `aqie-back-end.js`
- `src/server/routes/api/forecasts/` — `/api/forecasts` → calls `aqie-forecast-api.js`

---

## Conventions that differ from common practice

- **No semicolons** at end of statements.
- **Named exports only** — no default exports anywhere.
- **Function declarations** over arrow functions (use arrows for callbacks only).
- **Pin exact versions** in `package.json` — no `^` or `~`.
- **Test files co-located** alongside the module they test (`controller.test.js` next to `controller.js`). No root-level `tests/` directory.
- **Mock the shared helper, not `undici`** — tests mock `http-client.js` or the helper module (e.g. `aqie-back-end.js`) rather than `undici` directly.
- **Do not mock external libraries** unless absolutely necessary — prefer integration tests for external interactions.
- **SonarCloud duplication threshold is 3%** — extract shared logic into helpers rather than duplicating (e.g. `http-client.js`).

---

## Adding a new feature

1. Create `src/server/routes/[feature-name]/` with `index.js`, `controller.js`, `controller.test.js`, and optionally `[feature-name].njk`.
2. If it calls a new upstream API, add a helper in `src/server/common/helpers/` and reuse `http-client.js` for HTTP calls.
3. Register the plugin in `src/server/plugins/router.js`.
4. Add the upstream `url` config key to `src/config/config.js` with a sensible `default` and `env` var.

---

## Environment / config

All config is in `src/config/config.js` (convict).  
Key env vars:

- `PORT` (default `3000`)
- `AQIE_BACK_END_URL`, `AQIE_FORECAST_API_URL`
- `REDIS_HOST`, `SESSION_CACHE_ENGINE` (`memory` | `redis`)
- `NODE_ENV` (`development` | `test` | `production`)

---

## Pitfalls

- Redis is required in production — in dev/test it falls back to in-memory cache automatically.
- `AQIE_FORECAST_API_URL` is nullable; `getForecasts()` falls back to `aqieBackEnd.url + /forecasts` when unset.
- The `controller.test.js` at `src/server/routes/api/` is an integration test for the whole API surface — unit tests live inside each sub-feature folder.
- Pre-commit hook runs `security-audit`, `format:check`, `lint`, and `test`. Set it up with `npm run setup:husky`.
