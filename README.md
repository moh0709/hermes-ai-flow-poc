# Hermes AI Flow Framework

Hermes AI Flow started as a proof-of-concept, and it now serves as a reusable framework for running a ChatGPT PM → GitHub Issues → Hermes execution-agent workflow.

## What this framework is

This repository packages the working parts of a repeatable delivery loop:

1. A PM creates and labels work in GitHub Issues.
2. Hermes polls the queue on a VPS.
3. Hermes claims one runnable task.
4. Hermes executes the task, validates the result, and records artifacts.
5. Hermes reports back with logs, a report, a validation result, and a Git commit reference.
6. ChatGPT reviews the evidence and creates the next task.

The repository includes worker scripts, state handling, report conventions, framework documentation, templates, and reusable skill instructions.

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
  → marks it `hermes:working`
  → executes safe validation commands
  → writes LOGS/TASK-XXX-terminal.log
  → writes REPORTS/TASK-XXX-RESULT.md
  → updates .hermes/state.json
  → comments once with a clean final status
  → moves the issue to `pm:review` + `hermes:done` or `hermes:blocked`
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
npm run framework:doctor
npm run worker:once -- --json
```

If you are running this on a VPS with GitHub CLI access, the worker will inspect the issue queue and process the next runnable task.

## Label lifecycle

Use labels as the state machine around each task:

```text
pm:ready + hermes:ready
  → hermes:working
  → pm:review + hermes:done
```

If the task fails or is blocked:

```text
pm:ready + hermes:ready
  → hermes:working
  → pm:review + hermes:blocked
```

The worker now attempts to update these labels automatically. If labels do not exist or GitHub permissions are incomplete, the task still writes logs/reports and warns instead of crashing.

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
8. Run `npm run framework:doctor` to verify the setup.
9. Run `npm run worker:once` to verify the flow.
10. Run continuously with `npm run worker:watch` or a cron/systemd schedule.
11. Verify logs, reports, commit history, labels, and the issue comment.

For a complete walkthrough, see [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md), [`docs/HERMES_WORKER_SETUP.md`](docs/HERMES_WORKER_SETUP.md), and [`docs/PRODUCTION_HARDENING.md`](docs/PRODUCTION_HARDENING.md).

## Framework doctor

Run:

```bash
npm run framework:doctor
```

The doctor checks:

- required framework files,
- required directories,
- JSON validity,
- package scripts,
- log/report directories,
- GitHub CLI availability,
- GitHub labels when `gh` is authenticated.

Warnings mean the local environment may need setup. Failures mean the framework is missing required files or invalid JSON.

## Validation process

The standard validation loop is:

1. implement the task,
2. run the task's validation commands,
3. capture the terminal output in `LOGS/TASK-XXX-terminal.log`,
4. summarize the work in `REPORTS/TASK-XXX-RESULT.md`,
5. update `.hermes/state.json`,
6. comment once with final status,
7. update lifecycle labels,
8. commit and push the changes.

## Reuse in EverythingAI or another app

To reuse the framework:

1. copy the docs and templates,
2. configure the issue labels,
3. create a task issue format that includes acceptance criteria and validation commands,
4. point Hermes at the new repository,
5. keep the state file and worker logs in the new repo,
6. adapt the skill and prompt artifacts for the new project name,
7. run the framework doctor,
8. create a smoke-test issue before allowing production tasks.

See [`docs/REUSE_IN_OTHER_PROJECTS.md`](docs/REUSE_IN_OTHER_PROJECTS.md) and [`docs/EVERYTHINGAI_ADOPTION_PLAN.md`](docs/EVERYTHINGAI_ADOPTION_PLAN.md).

## Project layout

- `src/` — application and worker helpers
- `scripts/` — polling, worker, and doctor entry points
- `tests/` — automated tests
- `docs/` — framework documentation
- `templates/` — issue, report, and state templates
- `skills/` — reusable ChatGPT/Hermes prompts
- `.hermes/` — runtime state and task tracking
- `LOGS/` — terminal output captured by workers
- `REPORTS/` — human-readable task reports

## POC evidence

The historical proof-of-concept evidence from TASK-001 through TASK-005 is preserved in `LOGS/` and `REPORTS/` and should not be removed.
