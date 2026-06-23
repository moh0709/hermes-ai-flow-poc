# Setup Guide

This guide explains how to reuse the Hermes PM framework in a new repository.

## 1. Choose a GitHub repository

Pick the target repository that will receive tasks, labels, commits, logs, and reports.

## 2. Clone the repository on a VPS

```bash
git clone git@github.com:OWNER/REPO.git
cd REPO
```

## 3. Ensure Hermes and GitHub CLI access are available

Verify that:

- Node.js and npm are installed,
- GitHub CLI (`gh`) is installed and authenticated,
- Hermes has permission to read and write the repository,
- the VPS can reach GitHub over SSH or HTTPS.

## 4. Add the framework files

Copy in:

- `docs/`
- `templates/`
- `skills/`
- `.hermes/state.json`
- `scripts/task-poller.mjs`
- `scripts/task-worker.mjs`

Also keep the app code and tests that the worker will validate.

## 5. Create labels

Create the following labels in GitHub:

- `pm:ready`
- `hermes:ready`
- `hermes:working`
- `hermes:blocked`
- `hermes:done`
- `pm:review`

These labels allow the worker to discover runnable tasks and mark progress.

## 6. Add `.hermes/state.json`

Use [`templates/STATE_TEMPLATE.json`](../templates/STATE_TEMPLATE.json) as the starting point. This file prevents duplicate execution and stores the last task state.

## 7. Test with `npm run worker:once`

Create a test issue, label it, and run:

```bash
npm run worker:once -- --json
```

Confirm that Hermes finds the issue, claims it, validates it, and writes artifacts.

## 8. Run continuously

Use one of these options:

```bash
npm run worker:watch
```

or a cron/systemd scheduler that runs `npm run worker:once` on an interval.

## 9. Create a test issue

Use the issue template with:

- a title containing `TASK-###`,
- a clear objective,
- acceptance criteria,
- validation commands,
- labels `pm:ready` and `hermes:ready`.

## 10. Verify logs, reports, commit, and issue comment

After the worker completes, confirm:

- the `LOGS/` file exists,
- the `REPORTS/` file exists,
- `.hermes/state.json` was updated,
- the repository contains a Git commit for the work,
- the issue received a completion comment.

## Minimum success checklist

- Worker can find a runnable issue.
- Worker can run the validation commands.
- Worker can preserve artifacts.
- Worker can report completion back to GitHub.
