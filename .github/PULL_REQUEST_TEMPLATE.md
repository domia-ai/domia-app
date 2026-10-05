## What changed and why

<!-- One or two paragraphs. Link the issue if there is one. -->

## How it was verified

<!-- The commands you ran and what you saw. Add a screenshot or short clip for UI changes. -->

- [ ] `npm run validate`
- [ ] The screen was exercised against a real core node
- [ ] Unhappy paths checked: device offline, validation error, demo mode (read-only)
- [ ] Both languages checked, if text changed

## Checklist

- [ ] Logic is in `services/`; `server/` only validates and calls it
- [ ] Queries and mutations handle loading, error and a non-OK device response
- [ ] Every new string is in `messages/en.json` and `messages/es.json`
- [ ] No hand edits to `components/ui/*` or to generated files
- [ ] New write paths call `assertWritable()`
- [ ] Functional style: no classes, no mutation of props or query data, derived state is computed
- [ ] No comments in code; named types in `src/types/`
- [ ] No secrets, databases or recordings in the diff

## Contract with the core

- [ ] Not affected
- [ ] Core schema or templates changed — templates and config-schema snapshot re-synced, `constants/config.ts` updated, `check:overlay` passes

## Archive schema

- [ ] No schema change
- [ ] Schema change — needs `npm run db:build` and `npm run db:reset` (it wipes the archive)
