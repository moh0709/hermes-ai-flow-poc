# Reuse in Other Projects

This repository can be used as a starter kit for a new PM-to-Hermes workflow.

## Reuse checklist

1. Copy the worker scripts.
2. Copy the docs folder.
3. Copy the templates folder.
4. Copy the skills folder.
5. Add the state file.
6. Configure GitHub labels.
7. Confirm `gh` access on the VPS.
8. Create a test issue and verify the loop.

## What to customize

- repository name,
- issue labels,
- project-specific validation commands,
- project-specific issue templates,
- product-owner and reviewer names,
- deployment or release steps.

## What to keep

- task ID format,
- state tracking approach,
- log/report conventions,
- the worker queue behavior,
- the review loop.

## Why this is reusable

The framework avoids hard-coding a particular app. It only assumes:

- GitHub Issues are the queue,
- Hermes can access the repository,
- validation commands are explicit,
- task history must be preserved.
