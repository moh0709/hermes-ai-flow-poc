export const DEFAULT_TASK_LABELS = ['pm:ready', 'hermes:ready'];

export function normalizeTaskId(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/TASK-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

export function issueHasRequiredLabels(issue, requiredLabels = DEFAULT_TASK_LABELS) {
  const labels = Array.isArray(issue?.labels)
    ? issue.labels.map((label) => String(label?.name ?? label).toLowerCase())
    : [];

  return requiredLabels.every((label) => labels.includes(String(label).toLowerCase()));
}

export function isOpenIssue(issue) {
  return String(issue?.state ?? '').toLowerCase() === 'open';
}

export function extractIssueTaskId(issue) {
  return normalizeTaskId(`${issue?.title ?? ''}\n${issue?.body ?? ''}`);
}

export function issueIsRunnable(issue, state = {}) {
  if (!isOpenIssue(issue) || !issueHasRequiredLabels(issue)) {
    return false;
  }

  const taskId = extractIssueTaskId(issue);
  if (!taskId) {
    return false;
  }

  const currentTaskId = normalizeTaskId(state.current_task_id);
  const lastCompletedTaskId = normalizeTaskId(state.last_completed_task_id);

  return taskId !== currentTaskId && taskId !== lastCompletedTaskId;
}

export function selectRunnableIssue(issues, state = {}) {
  const sorted = [...(issues ?? [])].sort((a, b) => {
    const aUpdated = new Date(a.updatedAt ?? a.updated_at ?? 0).getTime();
    const bUpdated = new Date(b.updatedAt ?? b.updated_at ?? 0).getTime();
    return aUpdated - bUpdated;
  });

  return sorted.find((issue) => issueIsRunnable(issue, state)) ?? null;
}

export function defaultTaskQueueState() {
  return {
    source: 'github-issues',
    labels: [...DEFAULT_TASK_LABELS],
    poll_interval_seconds: 60,
    last_polled_at: null,
    current_issue_number: null,
    current_issue_url: null,
  };
}

export function buildPollingSummary({ issue, repo, state }) {
  if (!issue) {
    return {
      found: false,
      action: 'idle',
      repo,
      state,
    };
  }

  const taskId = extractIssueTaskId(issue);
  return {
    found: true,
    action: 'claimable',
    repo,
    task_id: taskId,
    issue: {
      number: issue.number,
      title: issue.title,
      url: issue.url,
      labels: Array.isArray(issue.labels) ? issue.labels.map((label) => label.name ?? label) : [],
    },
    state,
  };
}
