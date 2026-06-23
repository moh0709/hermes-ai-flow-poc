# EverythingAI Adoption Plan

This plan shows how to apply the Hermes PM framework to EverythingAI or a similar product.

## Phase 1: Foundation

- clone the framework repo,
- copy the docs and templates,
- confirm GitHub authentication on the VPS,
- establish the issue labels,
- create `.hermes/state.json`.

## Phase 2: Task queue

- create the first EverythingAI task issues,
- add acceptance criteria and validation commands,
- label them `pm:ready` and `hermes:ready`,
- run `npm run worker:once`.

## Phase 3: Validation and traceability

- verify that logs and reports are written,
- confirm issue comments are created,
- confirm commits reference the task work,
- keep the state file synchronized.

## Phase 4: Operationalize

- schedule the worker with cron or systemd,
- add project-specific review gates,
- add release or deployment validation commands,
- keep the PM and Product Owner review loop intact.

## Adoption risks

- hidden dependencies in task descriptions,
- missing GitHub CLI permissions,
- validation commands that require manual interaction,
- unclear acceptance criteria.

## Success signal

EverythingAI is ready to use the framework when a new issue can move from PM creation to Hermes execution to final review without manual rescue.
