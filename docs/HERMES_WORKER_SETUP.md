# Hermes Worker Setup

## Prerequisites

- Node.js installed
- npm installed
- Git installed
- GitHub CLI (`gh`) installed and authenticated
- repository cloned on the execution VPS

## Local setup

```bash
npm install
```

## Run once

```bash
npm run worker:once -- --json
```

Use this when you want a single queue poll and execution attempt.

## Run continuously

```bash
npm run worker:watch
```

Use this for a long-running VPS process.

## Cron example

```cron
* * * * * cd /path/to/repo && /usr/bin/npm run worker:once -- --json >> LOGS/task-worker-cron.log 2>&1
```

## Systemd example

A systemd timer is a good fit when you want reliable scheduling and restart behavior.

- service runs `npm run worker:once -- --json`
- timer triggers it on a fixed cadence
- logs go to the repository and the system journal

## Runtime artifacts

The worker should maintain:

- `LOGS/TASK-XXX-terminal.log`
- `REPORTS/TASK-XXX-RESULT.md`
- `.hermes/state.json`

## Operational notes

- Keep the GitHub CLI token valid.
- Keep the repo on the expected branch.
- Review `LOGS/` and `REPORTS/` when a task fails.
- Only mark a task complete after validation passes.
