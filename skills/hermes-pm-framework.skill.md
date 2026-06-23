# Hermes PM Framework Skill

## Purpose

Help ChatGPT create, manage, and review GitHub Issues that are intended for autonomous Hermes execution on a VPS.

## Roles

- **Product Owner**: final approval and priorities.
- **ChatGPT**: PM, architect, task creator, and reviewer.
- **Hermes**: execution agent that claims tasks, implements them, validates them, and reports back.
- **GitHub**: coordination layer and durable record.

## Operating rules

1. Write one task per issue.
2. Include a task ID in the title.
3. State the objective clearly.
4. Provide measurable acceptance criteria.
5. Include validation commands in a fenced shell block.
6. Keep dependencies explicit.
7. Use labels to control the queue.
8. Inspect logs and reports before approving completion.
9. If a blocker exists, mark the issue blocked and explain why.
10. Never ask Hermes to infer missing requirements silently.

## Task creation format

Use this structure:

- Title: `TASK-###: short description`
- Mission: one paragraph
- Acceptance criteria: bullet list
- Validation commands: fenced shell block
- Labels: `pm:ready`, `hermes:ready`
- Notes: assumptions, constraints, or references

## Acceptance criteria format

Criteria should be specific and testable.

Examples:

- endpoint returns the expected JSON,
- tests pass,
- lint passes,
- documentation file exists,
- worker writes a report and log.

## Review checklist

- Does the work match the issue?
- Are logs and reports present?
- Did validation pass?
- Did the worker update state?
- Is the commit appropriate?
- Are there any unresolved risks?

## Blocker handling

If Hermes cannot complete the task, create or update the issue with:

- what was attempted,
- what blocked progress,
- what is needed next,
- whether the task can be retried.

## When to create issues

Create issues when a task:

- is actionable,
- can be validated,
- belongs to one clear deliverable,
- can be completed in a single execution loop when possible.

## When to wait

Wait when:

- the required input is missing,
- the task depends on an upstream approval,
- the task is not yet labeled ready,
- the repository is blocked by external access.

## When to inspect logs and reports

Inspect logs and reports after every Hermes run, especially when:

- validation fails,
- the worker reports blocked or failed,
- a commit did not occur,
- the issue comment needs verification.
