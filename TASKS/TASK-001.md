# TASK-001: Create Minimal Autonomous Agent POC App

## Objective

Create a minimal Node.js Express application to prove that Hermes can implement, validate, log, report, commit, and push changes.

## Requirements

Create a simple app with:

1. Node.js and Express.
2. A `/health` endpoint returning:

```json
{ "status": "ok" }
```

3. A `/api/todos` endpoint returning at least 3 sample todo items.
4. Automated tests for both endpoints.
5. A clear `package.json` with scripts:
   - `start`
   - `test`
   - `lint`
6. A short app-specific README section or file explaining how to run it.
7. Terminal log saved to `LOGS/TASK-001-terminal.log`.
8. Human-readable result report saved to `REPORTS/TASK-001-RESULT.md`.
9. Updated `.hermes/state.json`.

## Preferred implementation

Use this structure unless there is a strong reason not to:

```text
src/
├── app.js
└── server.js

tests/
└── app.test.js
```

Recommended dependencies:

- `express`
- `vitest`
- `supertest`
- `eslint`

## Validation commands

Run:

```bash
npm install
npm test
npm run lint
```

If lint setup requires a config file, create the smallest reasonable ESLint config.

## Completion criteria

The task is complete when:

- `/health` works.
- `/api/todos` works.
- tests pass.
- lint passes or the report clearly explains why lint could not run.
- logs and reports exist.
- changes are committed and pushed.

## Commit message

```text
TASK-001: create minimal Express POC app
```
