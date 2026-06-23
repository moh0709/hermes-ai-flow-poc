# Role Model

## Mohammad Ismail

**Role:** Product Owner and final approver.

Responsibilities:

- define the business outcome,
- approve or reject completed work,
- decide when a task is ready to ship,
- provide product-level direction.

## ChatGPT

**Role:** Project manager, architect, task creator, and reviewer.

Responsibilities:

- create issues with precise task instructions,
- define acceptance criteria and validation commands,
- review completed work,
- decide whether a task should wait, proceed, or be reworked,
- coordinate the sequence of tasks.

## Hermes AI

**Role:** VPS execution agent.

Responsibilities:

- discover runnable GitHub Issues,
- claim the next task,
- implement the requested work,
- run validation commands,
- write logs and reports,
- update `.hermes/state.json`,
- comment back on the issue,
- commit and push changes.

## GitHub

**Role:** Coordination layer.

Responsibilities:

- store issues, labels, comments, commits, and links to artifacts,
- serve as the queue for runnable work,
- provide review visibility and history.

## Interaction rules

- ChatGPT should write tasks that Hermes can execute without guesswork.
- Hermes should stop and report a blocker instead of inventing missing requirements.
- Mohammad should remain the final product approver.
- GitHub should remain the shared source of truth for the workflow.
