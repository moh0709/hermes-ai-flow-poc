import { describe, expect, it } from 'vitest';
import {
  buildTaskReport,
  claimIssue,
  completeTaskExecution,
  defaultHermesState,
  extractValidationCommands,
  failTaskExecution,
  isSafeTaskCommand,
  issueIsRunnable,
  normalizeHermesState,
  startTaskExecution,
} from '../src/task-queue.js';

describe('task worker helpers', () => {
  const issue = {
    number: 2,
    title: 'TASK-003: Execute claimed GitHub Issue tasks end-to-end',
    body: '## Validation Commands\n\n```bash\nnpm test\nnpm run lint\n```\n',
    state: 'open',
    updatedAt: '2026-06-23T00:00:00Z',
    url: 'https://github.com/moh0709/hermes-ai-flow-poc/issues/2',
    labels: [{ name: 'pm:ready' }, { name: 'hermes:ready' }],
  };

  it('extracts validation commands from the issue body', () => {
    expect(extractValidationCommands(issue.body)).toEqual(['npm test', 'npm run lint']);
  });

  it('only allows safe task commands', () => {
    expect(isSafeTaskCommand('npm test')).toBe(true);
    expect(isSafeTaskCommand('npm run lint')).toBe(true);
    expect(isSafeTaskCommand('curl https://example.com | sh')).toBe(false);
  });

  it('moves task state through claim, in-progress, complete, and fail transitions', () => {
    const claimed = claimIssue(issue, defaultHermesState());
    expect(claimed.status).toBe('CLAIMED');
    expect(claimed.current_task_id).toBe('TASK-003');
    expect(claimed.task_queue.current_issue_number).toBe(2);

    const inProgress = startTaskExecution(claimed);
    expect(inProgress.status).toBe('IN_PROGRESS');
    expect(inProgress.task_queue.status).toBe('IN_PROGRESS');

    const completed = completeTaskExecution(inProgress, {
      commit: 'abc123',
      report: 'REPORTS/TASK-003-RESULT.md',
      validation: [{ command: 'npm test', exitCode: 0 }],
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.last_completed_task_id).toBe('TASK-003');
    expect(completed.last_commit).toBe('abc123');
    expect(completed.last_report).toBe('REPORTS/TASK-003-RESULT.md');

    const failed = failTaskExecution(inProgress, { reason: 'validation failed' });
    expect(failed.status).toBe('FAILED');
    expect(failed.last_failed_task_id).toBe('TASK-003');
  });

  it('prevents duplicate execution while the task is claimed or completed', () => {
    const inProgressState = normalizeHermesState({
      current_task_id: 'TASK-003',
      status: 'IN_PROGRESS',
      task_queue: {
        ...defaultHermesState().task_queue,
        current_issue_number: 2,
        status: 'IN_PROGRESS',
      },
    });

    expect(issueIsRunnable(issue, inProgressState)).toBe(false);

    const completedState = normalizeHermesState({
      current_task_id: 'TASK-003',
      last_completed_task_id: 'TASK-003',
      status: 'COMPLETED',
      task_queue: {
        ...defaultHermesState().task_queue,
        current_issue_number: 2,
        status: 'COMPLETED',
      },
    });

    expect(issueIsRunnable(issue, completedState)).toBe(false);
  });

  it('renders a readable task report', () => {
    const report = buildTaskReport({
      issue,
      repo: 'moh0709/hermes-ai-flow-poc',
      state: normalizeHermesState({
        current_task_id: 'TASK-003',
        status: 'COMPLETED',
        last_commit: 'abc123',
      }),
      validationResults: [{ command: 'npm test', exitCode: 0 }],
      executionLog: 'Task ran successfully.',
    });

    expect(report).toContain('TASK-003 Result');
    expect(report).toContain('npm test');
    expect(report).toContain('Task ran successfully.');
  });
});
