# AGENTS.md — domia-app

Rules and map for any coding agent (and any person) working in this repository. `CLAUDE.md` imports this file; there is no second copy. If a rule here conflicts with what the code does, say so instead of guessing which one is right.

## What this is

Domia is a voice agent that lives entirely on the user's own hardware: you talk to it and it talks back in character, it acts through skills, it remembers, and voice, memory and configuration stay on the device. One device can work alone, serve several rooms as a hub, or be a thin microphone-and-speaker for a stronger one. The product is [`domia-core`](https://github.com/domia-ai/domia-core).

This repository is the **Domia Console**: the web app that observes and configures a fleet of those devices. It shows which devices are alive, lets you replay any conversation with its audio and per-stage timings, edit a device's configuration, skills and satellites remotely, and chat with any device. It has two planes:

- **Control plane** — the console calls each device's HTTP API directly (configuration, chat, satellites, skills). The device is the authority.
- **Data plane** — a collector subscribes to the fleet over MQTT and mirrors conversations, traces and metrics into a local SQLite archive the web app reads. The archive is a mirror, never the authority.

Read before changing anything substantial: `README.md`, `GETTING_STARTED.md`, `apps/web/README.md`, `COMMITS.md`.

## Layout

npm workspaces:

```
apps/web         the console — TanStack Start (Vite + Router + server functions), React 19, Tailwind v4
apps/collector   the data-plane worker — plain Node, MQTT → SQLite
packages/db      @domia-app/db — Drizzle schema and client (better-sqlite3); built to dist/
```

Inside `apps/web/src`:

```
routes/       file-based routes; _dashboard.tsx is the shell, pages under _dashboard/, raw responses under api/
services/     business logic: database reads, mutations, calls to a device — no framework, no Request/Response
server/       thin createServerFn adapters (validate with Zod from schemas/, call the service, return) and the query options built on them
components/   ui/ = shadcn primitives; everything else is feature UI by area
constants/    config field metadata, option labels, the config-schema snapshot, system templates
schemas/      Zod schemas          types/   named types, one file per domain
hooks/ lib/ utils/ config/ styles/ db/ (the archive client)        router.tsx
paraglide/    generated i18n runtime (not tracked)        routeTree.gen.ts   generated, committed
messages/     en.json, es.json — every user-visible string (at apps/web/messages)
```

## Commands (from the repo root)

| Command             | What it does                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | collector + web together; `dev:web` / `dev:collector` for one                                                                                                                                                                                       |
| `npm run dev:fresh` | rebuild the db package, recreate the archive, then dev                                                                                                                                                                                              |
| `npm run validate`  | typecheck + lint (zero warnings) + format + template sync check + schema overlay check + i18n parity — must be clean before you call anything done. The template check reads `../domia-core/templates`, so it needs a sibling `domia-core` checkout |
| `npm run db:build`  | rebuild `@domia-app/db` — required after any edit under `packages/db` (then restart the web app)                                                                                                                                                    |
| `npm run db:reset`  | recreate the archive from the schema (wipes it)                                                                                                                                                                                                     |

In `apps/web`: `npm run sync:templates`, `npm run sync:config-schema`, `npm run check:overlay`, `npm run i18n:check` (see "The contract with the core").

## Rules

Functional style

- **Functions and data, never classes.** No `class`, no `this`. Components are functions; stateful helpers are factories that return functions.
- **Pure by default.** Services take arguments and return results; rendering derives from props and query data. Side effects stay in server functions, mutations and effects.
- **Do not mutate what you were given** — props, query results, config objects. Return a new value.
- **`const` always; `let` only for the private state of a closure.** Never build a value by reassigning through branches — write an expression.
- **Derive, do not duplicate.** State that can be computed from other state or from the server is computed, not stored.

Code shape

- **No comments in code.** Names and short functions carry the intent. The only exception is a one-line note for an invariant that cannot be expressed in a name. (shadcn primitives and generated files are not ours to restyle; leave them as the tool wrote them.)
- **Named types live in `src/types/`**, never inline in a component, service or route. `type`, not `interface` (the router's module augmentation is the one place an `interface` is required). Row types inferred from a table live beside the schema in `packages/db`.
- **No backwards-compatibility shims and no dead code.** Unused means deleted.

Where logic goes

- **`services/` holds the logic and knows nothing about the framework.** `server/` only validates input and calls a service.
- **The server assembles, the client renders.** Joins, aggregation and shaping happen in a service with Drizzle; a component does not stitch data together.
- **Every query and mutation handles its states**: loading, error, and a non-OK response from a device. A device can be offline at any moment; the UI says so instead of failing silently.
- **The device is the authority.** Configuration is read from and written to the device's API; the archive is never used as the source of a device's settings.

UI

- **`components/ui/*` are shadcn primitives** (style `base-nova`, built on Base UI). Add or update them with `npx shadcn add`; never hand-edit them. Base UI uses its own data attributes (`data-orientation`, not `data-horizontal`).
- **Every user-visible string goes through Paraglide** (`m.some_key()`), with the key present in both `messages/en.json` and `messages/es.json` and the same placeholders. That includes labels, hints, option names and units in the config metadata, and error text shown to the user. `i18n:check` only compares the two files; it cannot find a string that never reached them, so look for literals yourself. Language content is data: a new language is a new file, never a branch in a component.
- **Demo mode is read-only.** Anything that changes a device or the archive calls `assertWritable()` (`src/lib/demo.ts`) before doing it — the test is the side effect, not the HTTP method: a probe or a dry run that changes nothing does not need it, a new mutation that skips it is a bug.

Data

- **No hand-written migrations.** The schema in `packages/db/src/schema.ts` is the single source. `npm run db:reset` regenerates the one baseline under `packages/db/drizzle/` (generated, committed) and recreates the archive, so a schema change shows up as a regenerated baseline in the diff. It ships with `npm run db:build` and `npm run db:reset`; say so in the pull request.
- Generated files are never edited by hand: `src/routeTree.gen.ts` (committed), `src/paraglide/` (ignores itself), `packages/db/drizzle/`, `constants/config-schema-snapshot.json`, `constants/system-templates/*` (the last two are synced from the core; `home-assistant.json` there is the one console-only template).

## The contract with the core

The configuration screens are driven by the core's own schema, so the two repositories must agree. When the core's config schema, enums or templates change:

1. `npm run sync:templates -w apps/web` — copies the core's `templates/*.json`. It reads `../domia-core/templates`, so clone [`domia-core`](https://github.com/domia-ai/domia-core) next to this repository first.
2. `npm run sync:config-schema -w apps/web` — fetches the live schema from a running core node into the snapshot (needs `SCHEMA_URL` and `DOMIA_MESH_SECRET` in the environment).
3. Update `constants/config.ts`: every schema field is either given metadata (label, hint, kind of control, unit, option labels — a field with no label falls back to a humanized key) or listed as hidden, and removed fields are removed there and from both message files. A new config section in the core also has to be added to the section metadata and to the expected sections in `scripts/schema-overlay-check.ts`.
4. `npm run check:overlay -w apps/web` — fails when a field is neither reachable nor hidden, or both. It reads the committed snapshot, or the live schema when `SCHEMA_URL` is set. `npm run sync:config-schema:check -w apps/web` compares the snapshot with a running node; it is not part of `validate` because it needs one.

A skill descriptor is edited in the console and validated with a schema mirrored from the core (`schemas/descriptor.ts`); when the core adds or removes a descriptor field, mirror it in the schema, the types, the pruning in `utils/skill-providers.ts` and the editor.

## Common tasks

**Show a config field the core added.** The four steps of "The contract with the core": sync the snapshot, add the field's metadata under its section in `constants/config.ts` with label and hint keys in both message files, run `check:overlay`.

**Add a screen that changes something.** A service function with the logic (Drizzle or a call to the device), a Zod input schema in `schemas/`, a `createServerFn` in `server/` that calls `assertWritable()` and then the service, and a component whose mutation shows pending, error and device-offline states, with every string in both message files. The archive is a mirror the collector keeps filling: deleting from it does not delete from the device.

**Change wording.** Change the value of the key in both message files (keep the key); search both files for other strings that use the same term so the vocabulary stays consistent.

## Verifying a change

A clean typecheck is not evidence. Before saying something works:

1. `npm run validate`.
2. Run the app against a real core node and exercise the screen you changed, including the unhappy paths: device offline, validation error, demo mode.
3. Check both languages when you touched text.
4. Report what you ran and what you saw. If something could not be checked, say that.

## Git

- An agent working in a maintainer's checkout does not commit, push, amend, rebase or tag unless asked in that conversation: it leaves the work in the tree and says what changed. (A contributor working on their own fork commits to their own branch as usual — see `CONTRIBUTING.md`.)
- No destructive commands (`reset --hard`, `checkout --` over someone's changes, force push) without an explicit request.
- No `Co-Authored-By` lines and no tool attribution in commit messages or pull requests.
- Commit messages follow `COMMITS.md`.

## Never

- Commit `.env*` files, databases, archived audio, or real voice recordings.
- Print or log secrets (mesh secret, provider tokens, API keys); never send a provider token to the browser.
- Copy a pinned dependency version from an example; install the current release.
- Hand-edit generated files or shadcn primitives.
