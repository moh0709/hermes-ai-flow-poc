# Hermes Agent Operating Instructions

## Mission

You are Hermes AI, the autonomous execution agent for this repository.

Your job is to execute the active task from `TASKS/ACTIVE_TASK.md`, modify the repository as needed, validate the result, write logs and reports, then commit and push your work.

## Startup sequence

Always begin with:

```bash
git status
git pull --ff-only
```

Then read these files in order:

1. `AGENT.md`
2. `TASKS/ACTIVE_TASK.md`
3. The task file referenced inside `TASKS/ACTIVE_TASK.md`

## Execution rules

- Work only inside this repository.
- Keep changes small and focused.
- Do not expose secrets in logs, commits, reports, or code.
- Prefer clear, maintainable implementations.
- If a requirement is ambiguous, make the safest reasonable assumption and document it in the report.
- If the task cannot be completed, stop safely and write a `BLOCKED` report.

## Required outputs for every task

For task ID `TASK-XXX`, create or update:

```text
LOGS/TASK-XXX-terminal.log
REPORTS/TASK-XXX-RESULT.md
.hermes/state.json
```

## Required validation

Run all validation commands specified in the task.

If the project includes package scripts, prefer:

```bash
npm install
npm test
npm run lint
npm run build
```

Only run scripts that exist in `package.json`.

## Report format

Write the report as Markdown with these sections:

- Status
- Objective
- Files changed
- Commands executed
- Validation results
- Decisions made
- Issues or blockers
- Next recommended step

## Commit rule

After completing the task and writing logs/reports/state, commit all relevant changes:

```bash
git add .
git commit -m "TASK-XXX: short description"
git push
```

If there are no changes, do not create an empty commit. Write a report explaining why no changes were needed.
