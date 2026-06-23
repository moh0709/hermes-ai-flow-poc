# Hermes AI Flow Framework

Hermes AI Flow started as a proof-of-concept, and it now serves as a reusable framework for running a ChatGPT PM → GitHub Issues → Hermes execution-agent workflow.

## What this framework is

This repository packages the working parts of a repeatable delivery loop:

1. A PM creates and labels work in GitHub Issues.
2. Hermes polls the queue on a VPS.
3. Hermes claims one runnable task.
4. Hermes executes the task, validates the result, and records artifacts.
5. Hermes reports back with logs, a report, and a Git commit reference.

The repository includes the worker scripts, state handling, report conventions, and documentation needed to reuse the pattern in another project.

## When to use it

Use this framework when you want:

- a lightweight PM-to-executor workflow,
- GitHub Issues as the coordination layer,
- autonomous VPS execution with audit trails,
- a reusable pattern for another app such as EverythingAI,
- clear evidence for task completion, validation, and review.

## Architecture flow

```text
ChatGPT PM
  → creates issue in GitHub
  → labels it `pm:ready` and `hermes:ready`
  → writes acceptance criteria and validation commands

Hermes worker
  → polls GitHub Issues
  → claims the next runnable task
  → executes safe validation commands
  → writes LOGS/TASK-XXX-terminal.log
  → writes REPORTS/TASK-XXX-RESULT.md
  → updates .hermes/state.json
  → comments on the issue
  → commits and pushes repository changes

GitHub
  → stores task queue, labels, comments, commits, and artifacts
```

## Roles

- **Mohammad Ismail** — Product Owner and final approver.
- **ChatGPT** — Project manager, architect, task creator, and reviewer.
- **Hermes AI** — Execution agent on the VPS that discovers issues, executes tasks, validates, commits, and reports.
- **GitHub** — Coordination layer for issues, labels, comments, commits, logs, and reports.

See [`docs/ROLE_MODEL.md`](docs/ROLE_MODEL.md) for the full role model.

## Quick start

```bash
npm install
npm test
npm run lint
npm run worker:once -- --json
```

If you are running this on a VPS with GitHub CLI access, the worker will inspect the issue queue and process the next runnable task.

## Setup steps for a new project

1. Choose the target GitHub repository.
2. Clone the repository on the VPS.
3. Ensure Hermes and GitHub CLI access are available.
4. Add the framework files from this repo.
5. Create the labels:
   - `pm:ready`
   - `hermes:ready`
   - `hermes:working`
   - `hermes:blocked`
   - `hermes:done`
   - `pm:review`
6. Add `.hermes/state.json` using [`templates/STATE_TEMPLATE.json`](templates/STATE_TEMPLATE.json).
7. Create a test issue with validation commands.
8. Run `npm run worker:once` to verify the flow.
9. Run continuously with `npm run worker:watch` or a cron/systemd schedule.
10. Verify logs, reports, commit history, and the issue comment.

For a complete walkthrough, see [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) and [`docs/HERMES_WORKER_SETUP.md`](docs/HERMES_WORKER_SETUP.md).

## Validation process

The standard validation loop is:

1. implement the task,
2. run the task's validation commands,
3. capture the terminal output in `LOGS/TASK-XXX-terminal.log`,
4. summarize the work in `REPORTS/TASK-XXX-RESULT.md`,
5. update `.hermes/state.json`,
6. commit and push the changes.

This repository currently uses `npm test` and `npm run lint` as the primary validation commands for TASK-006.

## Reuse in EverythingAI or another app

To reuse the framework:

1. copy the docs and templates,
2. configure the issue labels,
3. create a task issue format that includes acceptance criteria and validation commands,
4. point Hermes at the new repository,
5. keep the state file and worker logs in the new repo,
6. adapt the skill and prompt artifacts for the new project name.

See [`docs/REUSE_IN_OTHER_PROJECTS.md`](docs/REUSE_IN_OTHER_PROJECTS.md) and [`docs/EVERYTHINGAI_ADOPTION_PLAN.md`](docs/EVERYTHINGAI_ADOPTION_PLAN.md).

## Project layout

- `src/` — application and worker helpers
- `scripts/` — polling and worker entry points
- `tests/` — automated tests
- `docs/` — framework documentation
- `templates/` — issue, report, and state templates
- `skills/` — reusable ChatGPT/Hermes prompts
- `.hermes/` — runtime state and task tracking
- `LOGS/` — terminal output captured by workers
- `REPORTS/` — human-readable task reports

## POC evidence

The historical proof-of-concept evidence from TASK-001 through TASK-005 is preserved in `LOGS/` and `REPORTS/` and should not be removed.
