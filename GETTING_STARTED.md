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

## Quick start (one command)

From the repo root, after `npm install` and configuring the collector `.env` (steps 1–2
below):

```bash
npm run dev:fresh
```

This builds `packages/db`, recreates the archive from zero, then runs the collector and
the web Console together (labelled `collector` / `web`; `Ctrl-C` stops both). Day to day,
once the archive exists, just `npm run dev`.

The fleet itself (`domia-core` instances) is launched separately — see Prerequisites.

### Root scripts

| Script                              | What it does                                                   |
| ----------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                       | collector + web together (`concurrently`, `Ctrl-C` kills both) |
| `npm run dev:fresh`                 | `db:build` → `db:reset` → `dev` — the full from-zero bring-up  |
| `npm run db:build`                  | compile `packages/db` (run after changing the schema/exports)  |
| `npm run db:reset`                  | recreate the archive DB from the current schema                |
| `npm run db:studio`                 | open Drizzle Studio against the archive                        |
| `npm run dev:collector` / `dev:web` | run a single plane on its own                                  |

The manual breakdown below is equivalent — useful when you want each process in its own
terminal (separate logs, restart one without the other).

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
