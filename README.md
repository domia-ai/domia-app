# Domia App — the Console

The **Console** for a fleet of Domia voice-AI devices — a local-first window to
**see every Domia, its conversations, moods and memory, and edit its configuration** —
without ever sending your data to the cloud.

One Console runs per property. It is a separate repo from `domia-core` (the devices) on
purpose: the Console observes and manages the fleet, the devices stay clean.

---

## Two planes

The Console talks to the fleet over two distinct planes:

- **Control plane** — _live and authoritative._ Reads and writes a Domia's configuration
  directly against the device's HTTP API. What you see is the device's truth, right now.
- **Data plane** — _a durable mirror._ The **collector** discovers Domias over MQTT
  (heartbeat), pulls their interaction history over HTTP (`/sync`), archives the audio of
  both what was heard and what was said, and stores it all in a local SQLite archive. If a
  device dies, the Console still holds its last known state and full history.

The archive is a **mirror, not the authority** — it can be deleted and rebuilt from the
fleet at any time.

---

## Layout

An npm-workspaces monorepo:

```
apps/web         the Console UI            (TanStack Start + TanStack Query)
apps/collector   the data plane worker     (Node 24, MQTT + HTTP, no framework)
packages/db      the shared archive        (@domia-app/db — Drizzle + better-sqlite3, WAL)
data/db          the SQLite archive        (domia-app.db)
data/audio       archived voices           (<domiaKey>/<input|tts>/<id>.wav)
```

The DB package is a pure library (`createDb(path)`); each app injects its own path from env.

## Stack

Node 24 · TypeScript · Drizzle ORM + better-sqlite3 (WAL) · MQTT · TanStack Start ·
zod-validated env · dotenvx.

---

## More

- [GETTING_STARTED.md](./GETTING_STARTED.md) — run the Console locally.
- [COMMITS.md](./COMMITS.md) — commit style.
