import { describe, expect, it } from 'vitest';
import {
  buildPollingSummary,
  defaultTaskQueueState,
  extractIssueTaskId,
  issueHasRequiredLabels,
  issueIsRunnable,
  normalizeTaskId,
  selectRunnableIssue,
} from '../src/task-queue.js';

describe('task queue helpers', () => {
  it('normalizes task IDs', () => {
    expect(normalizeTaskId('task-002')).toBe('TASK-002');
    expect(normalizeTaskId('No task here')).toBe(null);
  });

  it('extracts a task id from issue content', () => {
    const issue = { title: 'TASK-002: Build worker', body: 'Follow TASK-002 exactly' };
    expect(extractIssueTaskId(issue)).toBe('TASK-002');
  });

  it('detects required labels and runnable issues', () => {
    const issue = {
      number: 1,
      title: 'TASK-002: Build worker',
      body: 'Follow instructions',
      state: 'open',
      updatedAt: '2026-06-23T00:00:00Z',
      labels: [{ name: 'pm:ready' }, { name: 'hermes:ready' }],
    };

    expect(issueHasRequiredLabels(issue)).toBe(true);
    expect(issueIsRunnable(issue, defaultTaskQueueState())).toBe(true);
  });

  it('skips completed tasks', () => {
    const issue = {
      number: 1,
      title: 'TASK-001: done already',
      body: '',
      state: 'open',
      updatedAt: '2026-06-23T00:00:00Z',
      labels: [{ name: 'pm:ready' }, { name: 'hermes:ready' }],
    };
    const state = { current_task_id: 'TASK-002', last_completed_task_id: 'TASK-001', completed_task_ids: ['TASK-001'], completed_issue_numbers: [1] };

    expect(issueIsRunnable(issue, state)).toBe(false);
  });

  it('selects the first runnable issue and summarizes it', () => {
    const issues = [
      {
        number: 2,
        title: 'TASK-003: later',
        body: '',
        state: 'open',
        updatedAt: '2026-06-24T00:00:00Z',
        labels: [{ name: 'pm:ready' }, { name: 'hermes:ready' }],
      },
      {
        number: 1,
        title: 'TASK-002: earlier',
        body: '',
        state: 'open',
        updatedAt: '2026-06-23T00:00:00Z',
        labels: [{ name: 'pm:ready' }, { name: 'hermes:ready' }],
      },
    ];

    const selected = selectRunnableIssue(issues, {});
    expect(selected.number).toBe(1);

    const summary = buildPollingSummary({ issue: selected, repo: 'moh0709/hermes-ai-flow-poc', state: {} });
    expect(summary.found).toBe(true);
    expect(summary.task_id).toBe('TASK-002');
  });
});
