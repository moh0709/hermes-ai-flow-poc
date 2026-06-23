# Hermes AI Flow POC

Proof of concept flow between ChatGPT as project manager and Hermes as autonomous execution agent working on a VPS.

## Goal

Prove that Hermes can reliably:

1. Pull the repository on the VPS.
2. Read the repository-level agent instructions.
3. Read the active task.
4. Implement requested code changes.
5. Run validation commands.
6. Save terminal logs and execution reports.
7. Commit and push the result to GitHub.
8. Leave enough evidence for review.

## Source of truth

Hermes must always start by reading these files in this order:

1. `AGENT.md`
2. `TASKS/ACTIVE_TASK.md`
3. The task file referenced inside `TASKS/ACTIVE_TASK.md`

## Minimal app run instructions

Install dependencies and run the proof-of-concept app:

```bash
npm install
npm start
```

The server exposes:

- `GET /health` → `{ "status": "ok" }`
- `GET /api/todos` → a sample todo list

## Task polling worker

The Phase 2 POC adds a lightweight GitHub Issues poller for PM-to-Hermes work intake.

### Labels

Use these labels on GitHub issues:

- `pm:ready`
- `hermes:ready`

### Poll manually

```bash
npm run poll:tasks
```

To claim the next runnable task and update `.hermes/state.json` atomically:

```bash
npm run poll:tasks -- --claim
```

### Cron example

Run every 60 seconds:

```cron
* * * * * cd /path/to/hermes-ai-flow-poc && /usr/bin/npm run poll:tasks -- --claim >> LOGS/task-poller-cron.log 2>&1
```

### Systemd timer example

- Service: `hermes-task-poller.service`
- Timer: `hermes-task-poller.timer`
- Execute `npm run poll:tasks -- --claim` on schedule

The worker skips tasks already recorded in `.hermes/state.json` to prevent duplicate execution.

## Expected Hermes loop

```text
1. git pull
2. read AGENT.md
3. read TASKS/ACTIVE_TASK.md
4. read the referenced task file
5. execute the task
6. run validation commands
7. write LOGS/<TASK-ID>-terminal.log
8. write REPORTS/<TASK-ID>-RESULT.md
9. update .hermes/state.json
10. commit and push changes
```
