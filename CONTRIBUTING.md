# Contributing to domia-app

Thanks for wanting to help. This repository is the Domia Console: the web app that observes and configures a fleet of Domia voice-agent devices.

The rules of the codebase are in [`AGENTS.md`](AGENTS.md). They apply to people and to coding agents alike; read them before a first change.

## Set up

1. Follow [`GETTING_STARTED.md`](GETTING_STARTED.md): Node 24, an MQTT broker and at least one running [`domia-core`](https://github.com/domia-ai/domia-core) node.
2. `npm run dev` starts the collector and the web app.

## Make a change

1. Open an issue first for anything larger than a fix, so the direction is agreed before the work.
2. Branch from `main`.
3. Keep the change focused. One concern per pull request.
4. Verify it:
   - `npm run validate` — typecheck, lint with zero warnings, format, template sync, schema overlay, i18n parity
   - the screen you changed, against a real node, including a device that is offline and demo mode
   - both languages when you touched text
5. If the core's configuration schema or templates changed, re-sync them and update the field metadata in `constants/config.ts` (the four steps are in "The contract with the core" in `AGENTS.md`).

A change to the archive schema has no migration: it ships with `npm run db:build` and `npm run db:reset`, which wipes the archive. Say so in the pull request.

## Commit messages

Follow [`COMMITS.md`](COMMITS.md): `<emoji> <scope>: <short narrative> — <optional phrase>`, present tense.

## Pull requests

The template asks for three things: what changed and why, how you verified it (the commands and what you saw, with a screenshot for UI), and the rule checklist.

## Who decides what

- The maintainer reviews and merges every pull request.
- What the console shows by default, the roadmap and releases are the maintainer's call. Proposals are welcome as issues.

## Contributions made with AI tools

Welcome, and held to exactly the same bar. The person opening the pull request is responsible for it: they have read the diff, they ran the verification, and the description says what was actually run. Do not add tool attribution or `Co-Authored-By` lines for an AI tool.

## Reporting problems

- Bugs and feature ideas: the issue forms.
- Security problems: never in a public issue — see [`SECURITY.md`](SECURITY.md).
- Do not attach real conversations or voice recordings of other people, tokens or `.env` files to an issue.

## License

By contributing you agree that your contribution is licensed under the Apache License 2.0, the license of this repository.
