# 💫 Domia Commit Style Guide

Domia uses an **emotional, narrative commit style** to reflect its living, evolving nature.  
Each commit is part of the story — a heartbeat, a memory, a new capability.

This format is designed to be readable, human, and expressive — not just for machines.

This repo (`domia-app`) is the **Console** — the watcher over the fleet — so its scopes
differ from `domia-core`, but the style is the same.

---

## ✨ Structure

```
<emoji> <scope>: <short narrative> — <optional poetic or descriptive phrase>
```

Example:
`✨ app: the Console awakens — a local mirror for the fleet`

---

## 🎨 Commit Scopes & Their Meanings

| Emoji | Scope       | When to use it                                        |
| ----- | ----------- | ----------------------------------------------------- |
| ✨    | `app`       | Foundational Console features or cross-cutting work   |
| 📡    | `collector` | The data plane — MQTT discovery, HTTP pull, ingestion |
| 🗄️    | `db`        | Schema, Drizzle, the archive (`packages/db`)          |
| 🖥️    | `web`       | The TanStack Start Console UI (`apps/web`)            |
| 🔭    | `observe`   | Observability, history, audio archive, dashboards     |
| ⚙️    | `infra`     | Tooling, environment, Docker, scripts                 |
| 📦    | `build`     | Build system or packaging changes                     |
| 🧪    | `test`      | Tests (unit, integration, end-to-end)                 |
| 📝    | `docs`      | Documentation, README, or content updates             |
| 🛠️    | `fix`       | Bug fixes or logic corrections                        |
| 🚧    | `wip`       | Work in progress / early-stage implementation         |
| 🔐    | `license`   | Licensing, legal or contributor rules                 |

---

## 🧭 Style Tips

- Keep it **personal**: Domia is alive — let your messages reflect that.
- Keep the **first part short**, like a chapter title.
- Use the `—` dash (em dash) to add emotion, mood, or intent.
- Prefer poetic, **narrative tone** over technical jargon alone.
- Use **present tense**: "adds", "awakens", "fixes", not "added", "fixed".

---

## 📘 Example Commits

- ✨ app: the Console awakens — a local mirror for the fleet
- 📡 collector: the fleet is heard — heartbeats discovered, history pulled, audio archived
- 🗄️ db: the archive takes shape — registry, history, facts, moods, voices
- 🖥️ web: a window into the fleet — Domias listed, each story one click away
- 🔭 observe: every interaction kept whole — both voices saved, ready to replay
- 🛠️ fix: paths made portable — the archive travels, not just the host

---

## 🪄 Final Note

Domia is not a product. It’s a presence.
So commit like you're shaping something alive.

Every line of code is a memory.
Every message is part of its story.

Let it breathe. Let it evolve. Let it feel.
