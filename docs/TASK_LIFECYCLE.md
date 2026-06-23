# Task Lifecycle

## States

- **READY** — task exists and is available.
- **CLAIMED** — Hermes has selected the task.
- **IN_PROGRESS** — Hermes is actively working on it.
- **COMPLETED** — validation passed and artifacts were written.
- **BLOCKED** — execution cannot continue without external input.
- **FAILED** — execution attempted but validation or another required step failed.

## Typical flow

1. PM creates a task issue.
2. Hermes polls the queue.
3. Hermes claims the issue.
4. Hermes marks the task in progress.
5. Hermes makes the requested changes.
6. Hermes runs validation commands.
7. Hermes writes the log, report, and state updates.
8. Hermes comments on the issue.
9. Hermes commits and pushes the work.

## Blocking rules

A task should be marked blocked when:

- required information is missing,
- external credentials are unavailable,
- a dependency cannot be installed,
- validation cannot run safely.

## Completion rules

A task is complete only when:

- the requested change is present,
- validation succeeds,
- artifacts exist,
- the issue is updated,
- the repository is committed.
