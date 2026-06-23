# TASK-006 Result

- Repo: moh0709/hermes-ai-flow-poc
- Issue: #5 — TASK-006: Convert POC into reusable Hermes PM framework
- Status: FAILED
- Task ID: TASK-006
- Current commit: d4a8dcb1f761eb832c0070f917bf32f613ef1463

## Validation

- No validation commands were run.

## Execution log excerpt

```text
Repo: moh0709/hermes-ai-flow-poc
Issue: #5 TASK-006: Convert POC into reusable Hermes PM framework
Task ID: TASK-006

Instruction source:
## Mission
Convert this repository from a POC into a reusable framework for the ChatGPT PM to GitHub Issues to Hermes execution-agent workflow.

## Goal
Make this repo usable as a template/reference for other projects, including EverythingAI.

## Required Roles To Document
Document these roles clearly:

1. Mohammad Ismail: Product Owner and final approver.
2. ChatGPT: Project manager, architect, task creator, reviewer.
3. Hermes AI: VPS execution agent that discovers issues, executes tasks, validates, commits, and reports.
4. GitHub: Coordination layer for issues, labels, comments, commits, logs, and reports.

## Required Documentation Structure
Create these files where practical:

- docs/FRAMEWORK_OVERVIEW.md
- docs/SETUP_GUIDE.md
- docs/ROLE_MODEL.md
- docs/GITHUB_ISSUE_PROTOCOL.md
- docs/HERMES_WORKER_SETUP.md
- docs/TASK_LIFECYCLE.md
- docs/LOGGING_AND_REPORTING.md
- docs/REUSE_IN_OTHER_PROJECTS.md
- docs/EVERYTHINGAI_ADOPTION_PLAN.md
- templates/ISSUE_TEMPLATE_TASK.md
- templates/ISSUE_TEMPLATE_BUGFIX.md
- templates/ISSUE_TEMPLATE_REVIEW.md
- templates/REPORT_TEMPLATE.md
- templates/STATE_TEMPLATE.json
- skills/hermes-pm-framework.skill.md
- skills/hermes-pm-framework.prompt.json

## Main README Update
Update README.md so the repo is presented as a reusable framework, not only a POC.

README should explain:

- what the framework is,
- when to use it,
- architecture flow,
- roles,
- quick start,
- setup steps,
- validation process,
- how to reuse it for EverythingAI or another app.

## Setup Guide Requirements
The setup guide must include step-by-step instructions for a new project:

1. Choose GitHub repo.
2. Clone repo on VPS.
3. Ensure Hermes and GitHub CLI access are available.
4. Add framework files.
5. Create labels: pm:ready, hermes:ready, hermes:working, hermes:blocked, hermes:done, pm:review.
6. Add .hermes/state.json.
7. Test with npm run worker:once.
8. Run continuously with npm run worker:watch or scheduled worker.
9. Create test issue.
10. Verify logs, reports, commit, and issue comment.

## Global Skill Requirements
Create a reusable skill document for ChatGPT that includes:

- purpose,
- roles,
- operating rules,
- task creation format,
- acceptance criteria format,
- review checklist,
- blocker handling,
- when to create issues,
- when to wait,
- when to inspect logs and reports.

Also create a JSON prompt for bootstrapping Hermes in a new repository.

## Keep POC Evidence
Do not remove TASK-001 to TASK-005 evidence. It is useful proof history.

## Validation Commands
Run:

npm test
npm run lint

Also check that JSON files are valid.

## Deliverables
- Updated README.md
- New docs folder
- New templates folder
- New skills folder
- Updated .hermes/state.json
- LOGS/TASK-006-terminal.log
- REPORTS/TASK-006-RESULT.md
- Completion comment on this issue with status, validation result, report path, log path, and commit hash.

## Acceptance Criteria
- A new developer can reuse this setup from the documentation.
- Roles are clear.
- GitHub Issues workflow is clear.
- Hermes worker setup is clear.
- The skill package is reusable in other projects.
- EverythingAI adoption plan is included.
- Tests pass.
- Lint passes.

## PM Note
This task is approved by Mohammad and ChatGPT. The objective is to finalize the POC into a reusable global AI teamwork framework.
```
