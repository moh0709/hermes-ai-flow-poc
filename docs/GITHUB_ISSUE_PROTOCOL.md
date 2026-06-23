# GitHub Issue Protocol

## Issue format

A runnable issue should include:

- a task ID in the title, such as `TASK-006`,
- a short mission statement,
- acceptance criteria,
- validation commands,
- labels `pm:ready` and `hermes:ready`.

## Label protocol

Recommended labels:

- `pm:ready` — task is approved by the PM,
- `hermes:ready` — task is safe for Hermes to execute,
- `hermes:working` — task is claimed or in progress,
- `hermes:blocked` — execution stopped on a blocker,
- `hermes:done` — task is finished,
- `pm:review` — task is ready for PM review.

## Task queue rules

1. A task must be open.
2. A task must have the runnable labels.
3. The task must contain a recognizable `TASK-###` ID.
4. Hermes must avoid re-running tasks already completed in `.hermes/state.json`.

## Completion protocol

On completion, Hermes should:

- write the log file,
- write the report file,
- update the state file,
- comment on the issue with the result,
- commit and push the changes.

## Good issue hygiene

- Keep one task per issue.
- Put validation commands inside a fenced shell block.
- Avoid hidden dependencies.
- Keep acceptance criteria measurable.
