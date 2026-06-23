# Production Hardening Guide

This guide lists practical controls for using the Hermes PM framework in larger projects.

## Label lifecycle

Use labels as the shared task state:

```text
pm:ready + hermes:ready
  -> hermes:working
  -> pm:review + hermes:done
```

If Hermes cannot finish the task:

```text
pm:ready + hermes:ready
  -> hermes:working
  -> pm:review + hermes:blocked
```

A blocked task should wait for PM review before another attempt.

## Final issue comment

Hermes should post a single final status comment:

```md
## Hermes result: TASK-XXX

Status: COMPLETED | FAILED
Validation: PASS | FAIL
Report: `REPORTS/TASK-XXX-RESULT.md`
Log: `LOGS/TASK-XXX-terminal.log`
Commit: `<commit-sha>`
```

## Duplicate protection

The state file should record completed task IDs and issue numbers. The worker should skip completed work.

## Framework doctor

Run this before using a new repository:

```bash
npm run framework:doctor
```

The doctor checks required files, JSON files, package scripts, artifact folders, GitHub CLI availability, and expected labels.

## Validation commands

Use simple commands such as:

```bash
npm test
npm run lint
npm run build
```

## PM review

For small tasks, direct commits can be acceptable. For larger tasks, use a branch or pull request. Important work should wait for PM review before release.

## EverythingAI adoption gate

Before using this on EverythingAI:

1. Create a low-risk documentation issue.
2. Add `pm:ready` and `hermes:ready`.
3. Let Hermes discover it automatically.
4. Confirm report, log, state, labels, comment, and commit.
5. Let ChatGPT review the result.
