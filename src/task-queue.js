export const DEFAULT_TASK_LABELS = ['pm:ready', 'hermes:ready'];
export const TASK_STATUSES = ['READY', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'FAILED'];

function upperOrNull(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return TASK_STATUSES.includes(trimmed) ? trimmed : null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

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

export function defaultTaskQueueState() {
  return {
    source: 'github-issues',
    labels: [...DEFAULT_TASK_LABELS],
    poll_interval_seconds: 60,
    last_polled_at: null,
    last_claimed_at: null,
    last_started_at: null,
    last_completed_at: null,
    last_failed_at: null,
    current_task_id: null,
    current_issue_number: null,
    current_issue_url: null,
    current_issue_title: null,
    current_issue_body: null,
    status: 'READY',
  };
}

export function defaultHermesState() {
  return {
    current_task_id: null,
    status: 'READY',
    last_started_at: null,
    last_completed_at: null,
    last_failed_at: null,
    last_claimed_at: null,
    last_commit: null,
    last_report: null,
    last_validation: null,
    last_completed_task_id: null,
    last_failed_task_id: null,
    task_queue: defaultTaskQueueState(),
  };
}

export function normalizeTaskQueueState(state = {}) {
  const queue = state.task_queue ?? state ?? {};
  return {
    ...defaultTaskQueueState(),
    ...queue,
    labels: Array.isArray(queue.labels) && queue.labels.length > 0 ? [...queue.labels] : [...DEFAULT_TASK_LABELS],
    poll_interval_seconds: Number.isFinite(queue.poll_interval_seconds) ? queue.poll_interval_seconds : 60,
    last_polled_at: normalizeDate(queue.last_polled_at),
    last_claimed_at: normalizeDate(queue.last_claimed_at),
    last_started_at: normalizeDate(queue.last_started_at),
    last_completed_at: normalizeDate(queue.last_completed_at),
    last_failed_at: normalizeDate(queue.last_failed_at),
    current_task_id: normalizeTaskId(queue.current_task_id),
    status: upperOrNull(queue.status) ?? 'READY',
  };
}

export function normalizeHermesState(state = {}) {
  const queue = normalizeTaskQueueState(state);
  const status = upperOrNull(state.status) ?? queue.status;
  return {
    ...defaultHermesState(),
    ...state,
    current_task_id: normalizeTaskId(state.current_task_id ?? queue.current_task_id),
    status,
    last_started_at: normalizeDate(state.last_started_at ?? queue.last_started_at),
    last_completed_at: normalizeDate(state.last_completed_at ?? queue.last_completed_at),
    last_failed_at: normalizeDate(state.last_failed_at ?? queue.last_failed_at),
    last_claimed_at: normalizeDate(state.last_claimed_at ?? queue.last_claimed_at),
    last_commit: state.last_commit ?? null,
    last_report: state.last_report ?? null,
    last_validation: state.last_validation ?? null,
    last_completed_task_id: normalizeTaskId(state.last_completed_task_id),
    last_failed_task_id: normalizeTaskId(state.last_failed_task_id),
    task_queue: queue,
  };
}

export function issueIsRunnable(issue, state = {}) {
  if (!isOpenIssue(issue) || !issueHasRequiredLabels(issue)) {
    return false;
  }

  const taskId = extractIssueTaskId(issue);
  if (!taskId) {
    return false;
  }

  const queueState = normalizeHermesState(state);
  const currentTaskId = normalizeTaskId(queueState.current_task_id);
  const lastCompletedTaskId = normalizeTaskId(queueState.last_completed_task_id);
  const lastFailedTaskId = normalizeTaskId(queueState.last_failed_task_id);
  const currentIssueNumber = queueState.task_queue.current_issue_number;
  const currentIssueStatus = upperOrNull(queueState.status) ?? 'READY';

  if (currentIssueStatus === 'CLAIMED' || currentIssueStatus === 'IN_PROGRESS') {
    if (currentIssueNumber === issue.number || currentTaskId === taskId) {
      return false;
    }
  }

  return taskId !== currentTaskId && taskId !== lastCompletedTaskId && taskId !== lastFailedTaskId;
}

export function selectRunnableIssue(issues, state = {}) {
  const sorted = [...(issues ?? [])].sort((a, b) => {
    const aUpdated = new Date(a.updatedAt ?? a.updated_at ?? 0).getTime();
    const bUpdated = new Date(b.updatedAt ?? b.updated_at ?? 0).getTime();
    return aUpdated - bUpdated;
  });

  return sorted.find((issue) => issueIsRunnable(issue, state)) ?? null;
}

export function claimIssue(issue, state = {}) {
  const taskId = extractIssueTaskId(issue);
  const queueState = normalizeHermesState(state);
  const now = new Date().toISOString();
  return {
    ...queueState,
    current_task_id: taskId,
    current_issue_number: issue.number,
    current_issue_url: issue.url ?? null,
    current_issue_title: issue.title ?? null,
    current_issue_body: issue.body ?? null,
    status: 'CLAIMED',
    last_claimed_at: now,
    task_queue: {
      ...queueState.task_queue,
      current_task_id: taskId,
      current_issue_number: issue.number,
      current_issue_url: issue.url ?? null,
      current_issue_title: issue.title ?? null,
      current_issue_body: issue.body ?? null,
      status: 'CLAIMED',
      last_claimed_at: now,
      last_polled_at: now,
    },
  };
}

export function startTaskExecution(state = {}) {
  const queueState = normalizeHermesState(state);
  const now = new Date().toISOString();
  return {
    ...queueState,
    status: 'IN_PROGRESS',
    last_started_at: now,
    task_queue: {
      ...queueState.task_queue,
      status: 'IN_PROGRESS',
      last_started_at: now,
    },
  };
}

export function completeTaskExecution(state = {}, { commit = null, report = null, validation = null } = {}) {
  const queueState = normalizeHermesState(state);
  const now = new Date().toISOString();
  return {
    ...queueState,
    status: 'COMPLETED',
    last_completed_at: now,
    last_completed_task_id: queueState.current_task_id,
    last_commit: commit,
    last_report: report,
    last_validation: validation,
    task_queue: {
      ...queueState.task_queue,
      status: 'COMPLETED',
      last_completed_at: now,
      last_polled_at: now,
    },
  };
}

export function failTaskExecution(state = {}, { reason = null, validation = null } = {}) {
  const queueState = normalizeHermesState(state);
  const now = new Date().toISOString();
  return {
    ...queueState,
    status: 'FAILED',
    last_failed_at: now,
    last_failed_task_id: queueState.current_task_id,
    last_validation: validation ?? reason,
    task_queue: {
      ...queueState.task_queue,
      status: 'FAILED',
      last_failed_at: now,
      last_polled_at: now,
    },
  };
}

export function blockTaskExecution(state = {}, { reason = null } = {}) {
  const queueState = normalizeHermesState(state);
  const now = new Date().toISOString();
  return {
    ...queueState,
    status: 'BLOCKED',
    last_failed_at: now,
    last_validation: reason,
    task_queue: {
      ...queueState.task_queue,
      status: 'BLOCKED',
      last_failed_at: now,
      last_polled_at: now,
    },
  };
}

export function buildPollingSummary({ issue, repo, state }) {
  const normalizedState = normalizeHermesState(state);
  if (!issue) {
    return {
      found: false,
      action: 'idle',
      repo,
      status: normalizedState.status,
      state: normalizedState,
    };
  }

  const taskId = extractIssueTaskId(issue);
  return {
    found: true,
    action: 'claimable',
    repo,
    status: normalizedState.status,
    task_id: taskId,
    issue: {
      number: issue.number,
      title: issue.title,
      url: issue.url,
      labels: Array.isArray(issue.labels) ? issue.labels.map((label) => label.name ?? label) : [],
    },
    state: normalizedState,
  };
}

export function buildExecutionSummary({ issue, repo, state, validation = null, report = null, commit = null, execution = null }) {
  const normalizedState = normalizeHermesState(state);
  const taskId = extractIssueTaskId(issue);
  return {
    found: true,
    action: normalizedState.status.toLowerCase(),
    repo,
    task_id: taskId,
    issue: {
      number: issue.number,
      title: issue.title,
      url: issue.url,
      labels: Array.isArray(issue.labels) ? issue.labels.map((label) => label.name ?? label) : [],
    },
    validation,
    report,
    commit,
    execution,
    state: normalizedState,
  };
}

export function extractValidationCommands(body = '') {
  const text = String(body);
  const validationHeader = /^##\s+Validation Commands\s*$/im;
  const headerMatch = validationHeader.exec(text);
  if (!headerMatch) {
    return [];
  }

  const afterHeader = text.slice(headerMatch.index + headerMatch[0].length);
  const fencedMatch = afterHeader.match(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)```/i);
  if (!fencedMatch) {
    return [];
  }

  return fencedMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export function isSafeTaskCommand(command) {
  return /^(npm|node|git|npx)\b/.test(command) && !/[|><`$;]/.test(command);
}

export function buildTaskReport({ issue, repo, state, validationResults = [], executionLog = '' }) {
  const normalizedState = normalizeHermesState(state);
  const taskId = extractIssueTaskId(issue) ?? 'unknown';
  const commands = validationResults
    .map((result) => `- \`${result.command}\` → ${result.exitCode === 0 ? 'PASS' : 'FAIL'}`)
    .join('\n') || '- No validation commands were run.';

  return [
    `# ${taskId} Result`,
    '',
    `- Repo: ${repo}`,
    `- Issue: #${issue.number} — ${issue.title}`,
    `- Status: ${normalizedState.status}`,
    `- Task ID: ${taskId}`,
    `- Current commit: ${normalizedState.last_commit ?? 'n/a'}`,
    '',
    '## Validation',
    '',
    commands,
    '',
    '## Execution log excerpt',
    '',
    '```text',
    executionLog.trim() || 'No execution log captured.',
    '```',
    '',
  ].join('\n');
}
