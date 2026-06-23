# Logging and Reporting

## Logging rules

Each task should write a terminal log at:

```text
LOGS/TASK-XXX-terminal.log
```

The log should include:

- the issue title,
- the task ID,
- the commands executed,
- command output,
- failure details when relevant.

## Report rules

Each task should write a human-readable report at:

```text
REPORTS/TASK-XXX-RESULT.md
```

The report should include:

- status,
- objective,
- files changed,
- commands executed,
- validation results,
- decisions made,
- blockers,
- next step.

## What good evidence looks like

- a log that shows exactly what was run,
- a report that explains what changed and why,
- a state file that reflects the latest outcome,
- a commit hash that points to the repository revision.

## Failure reporting

If a task fails, the report should clearly say why and whether the failure is recoverable.
