# Getting Started — Domia Console

How to run the Console locally against a Domia fleet.

## Prerequisites

- **Node 24** (see [`.nvmrc`](./.nvmrc) — `nvm use`).
- An **MQTT broker** the fleet and the collector both reach (dev: a local Mosquitto on
  `localhost:1883`).
- A **Domia fleet** emitting heartbeats on that broker — in dev, two `domia-core`
  instances launched by env file: `DOMIA_ENV=.env npm run dev` (hub) and
  `DOMIA_ENV=.env.edge npm run dev` (edge), or the `npm run dev:hub` / `dev:edge`
  wrappers. Each Domia boots neutral and gets its role from a config template.

## 1. Install

```bash
npm install
```

## 2. Configure env

Each app reads a zod-validated `.env`. Copy the examples and adjust if needed:

```bash
cp apps/collector/.env.example apps/collector/.env
```

Key collector vars: `DATABASE_URL` (defaults to the shared `data/db/domia-app.db`),
`DOMIA_APP_AUDIO_DIR`, `MQTT_URL` / `MQTT_USERNAME` / `MQTT_PASSWORD`,
`DOMIA_APP_SYNC_PAGE_SIZE` / `DOMIA_APP_SYNC_MAX_PAGES`.

## 3. Create the archive

The DB is a durable archive; it is created explicitly (never on boot):

```bash
npm run db:reset -w @domia-app/db
```

`db:reset` recreates the schema from zero (`packages/db/src/schema.ts`) — there are no
hand-written migrations; the schema is the single source of truth.

## 4. Run the collector (data plane)

```bash
npm run dev -w @domia-app/collector
```

It connects to MQTT, discovers Domias from their heartbeats, mirrors their history and
audio into the archive, and keeps the registry fresh. With `DEBUG=domia-app:*` it logs
each step.

## 5. Run the web Console

```bash
npm run dev -w apps/web
```

---

## Notes

- The archive can be wiped and rebuilt at any time: stop the collector, `npm run db:reset
-w @domia-app/db`, restart — the collector re-ingests everything from the fleet.
- Lint / format the workspace: `npm run lint`, `npm run format:fix`.
- See [README.md](./README.md) for the architecture and [COMMITS.md](./COMMITS.md) for the
  commit style.
