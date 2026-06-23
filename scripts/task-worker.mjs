#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  buildExecutionSummary,
  buildTaskReport,
  claimIssue,
  completeTaskExecution,
  defaultHermesState,
  extractIssueTaskId,
  extractValidationCommands,
  failTaskExecution,
  isSafeTaskCommand,
  normalizeHermesState,
  selectRunnableIssue,
  startTaskExecution,
} from '../src/task-queue.js';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const stateFile = path.join(repoRoot, '.hermes', 'state.json');
const logDir = path.join(repoRoot, 'LOGS');
const reportDir = path.join(repoRoot, 'REPORTS');

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    watch: args.has('--watch'),
    dryRun: args.has('--dry-run'),
    json: args.has('--json'),
    once: args.has('--once') || !args.has('--watch'),
  };
}

async function loadJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function saveJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function getRepoFullName() {
  const { stdout } = await execFileAsync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  });

  return stdout.trim();
}

async function listReadyIssues(repo) {
  const { stdout } = await execFileAsync(
    'gh',
    [
      'issue',
      'list',
      '-R',
      repo,
      '--state',
      'open',
      '--label',
      'pm:ready',
      '--label',
      'hermes:ready',
      '--json',
      'number,title,body,url,labels,state,updatedAt',
    ],
    {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

async function viewIssue(repo, number) {
  const { stdout } = await execFileAsync(
    'gh',
    ['issue', 'view', '-R', repo, String(number), '--json', 'number,title,body,url,labels,state,updatedAt'],
    {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

function splitCommand(command) {
  const parts = [];
  const re = /(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\s]+))/g;
  let match;

  while ((match = re.exec(command)) !== null) {
    const value = match[1] ?? match[2] ?? match[3];
    parts.push(value.replace(/\\(["'\\])/g, '$1'));
  }

  return parts;
}

async function runCommand(command) {
  const [bin, ...args] = splitCommand(command);
  const startedAt = new Date().toISOString();
  const { stdout, stderr } = await execFileAsync(bin, args, {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 10,
  });
  return {
    command,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: 0,
    stdout,
    stderr,
  };
}

async function runValidationCommands(issue) {
  const commands = extractValidationCommands(issue.body ?? '').filter(isSafeTaskCommand);
  const results = [];
  const logChunks = [];
  let error = null;

  for (const command of commands) {
    logChunks.push(`$ ${command}`);
    try {
      const result = await runCommand(command);
      results.push(result);
      if (result.stdout.trim()) {
        logChunks.push(result.stdout.trimEnd());
      }
      if (result.stderr.trim()) {
        logChunks.push(result.stderr.trimEnd());
      }
    } catch (caughtError) {
      const stdout = caughtError?.stdout ? String(caughtError.stdout) : '';
      const stderr = caughtError?.stderr ? String(caughtError.stderr) : '';
      const failure = {
        command,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        exitCode: typeof caughtError?.code === 'number' ? caughtError.code : 1,
        stdout,
        stderr: stderr || caughtError?.message || String(caughtError),
      };
      results.push(failure);
      if (stdout.trim()) {
        logChunks.push(stdout.trimEnd());
      }
      if (stderr.trim()) {
        logChunks.push(stderr.trimEnd());
      }
      error = new Error(`Validation failed for command: ${command}`);
      error.cause = caughtError;
      break;
    }
  }

  return {
    commands,
    results,
    log: logChunks.join('\n\n'),
    error,
  };
}

async function writeTaskArtifacts(taskId, logContent, reportContent) {
  await ensureDir(logDir);
  await ensureDir(reportDir);
  const logPath = path.join(logDir, `${taskId}-terminal.log`);
  const reportPath = path.join(reportDir, `${taskId}-RESULT.md`);
  await writeFile(logPath, `${logContent.trimEnd()}\n`);
  await writeFile(reportPath, reportContent);
  return { logPath, reportPath };
}

async function commentOnIssue(repo, issueNumber, body) {
  await execFileAsync('gh', ['issue', 'comment', '-R', repo, String(issueNumber), '--body', body], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  });
}

async function updateIssueLabels(repo, issueNumber, { add = [], remove = [] } = {}) {
  const args = ['issue', 'edit', '-R', repo, String(issueNumber)];

  for (const label of add) {
    args.push('--add-label', label);
  }
  for (const label of remove) {
    args.push('--remove-label', label);
  }

  if (args.length === 5) {
    return;
  }

  try {
    await execFileAsync('gh', args, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    console.warn(`Issue label update skipped for #${issueNumber}: ${error?.message ?? error}`);
  }
}

async function markIssueClaimed(repo, issueNumber) {
  await updateIssueLabels(repo, issueNumber, {
    add: ['hermes:working'],
    remove: ['hermes:ready'],
  });
}

async function markIssueCompleted(repo, issueNumber) {
  await updateIssueLabels(repo, issueNumber, {
    add: ['hermes:done', 'pm:review'],
    remove: ['pm:ready', 'hermes:ready', 'hermes:working', 'hermes:blocked'],
  });
}

async function markIssueFailed(repo, issueNumber) {
  await updateIssueLabels(repo, issueNumber, {
    add: ['hermes:blocked', 'pm:review'],
    remove: ['pm:ready', 'hermes:ready', 'hermes:working', 'hermes:done'],
  });
}

async function getCommitHash() {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

function validationSummary(validation) {
  if (!validation?.results?.length) {
    return 'No validation commands were executed.';
  }

  return validation.results
    .map((result) => `- ${result.command}: ${result.exitCode === 0 ? 'PASS' : 'FAIL'}`)
    .join('\n');
}

function buildFinalIssueComment({ taskId, validationPassed, reportPath, logPath, commit, validation }) {
  const status = validationPassed ? 'COMPLETED' : 'FAILED';
  return [
    `<!-- hermes-final:${taskId} -->`,
    `## Hermes result: ${taskId}`,
    '',
    `Status: ${status}`,
    `Validation: ${validationPassed ? 'PASS' : 'FAIL'}`,
    `Report: \`${reportPath}\``,
    `Log: \`${logPath}\``,
    `Commit: \`${commit}\``,
    '',
    '### Validation commands',
    validationSummary(validation),
  ].join('\n');
}

async function executeTask({ repo, issue, state, dryRun }) {
  const claimedState = claimIssue(issue, state);
  const taskId = extractIssueTaskId(issue);

  if (dryRun) {
    return {
      state: claimedState,
      issue,
      taskId,
      dryRun: true,
      log: `Dry run: would claim ${taskId} from issue #${issue.number}`,
      reportPath: null,
      logPath: null,
      validation: null,
      commit: null,
    };
  }

  await saveJson(stateFile, claimedState);
  await markIssueClaimed(repo, issue.number);

  const inProgressState = startTaskExecution(claimedState);
  await saveJson(stateFile, inProgressState);

  const validation = await runValidationCommands(issue);
  const hasCommands = validation.commands.length > 0;
  const validationPassed = hasCommands && !validation.error && validation.results.every((result) => result.exitCode === 0);
  const commit = await getCommitHash();
  const executionState = validationPassed
    ? completeTaskExecution(inProgressState, {
        commit,
        report: null,
        validation: validation.results,
      })
    : {
        ...failTaskExecution(inProgressState, {
          reason: validation.error?.message ?? (hasCommands ? 'Validation failed' : 'No safe validation commands found'),
          validation: validation.results,
        }),
        last_commit: commit,
      };

  const executionLog = [
    `Repo: ${repo}`,
    `Issue: #${issue.number} ${issue.title}`,
    `Task ID: ${taskId}`,
    '',
    `Instruction source:\n${issue.body ?? '(no body)'}`,
    '',
    validation.log,
  ].join('\n');

  const reportContent = buildTaskReport({
    issue,
    repo,
    state: executionState,
    validationResults: validation.results,
    executionLog,
  });
  const { logPath, reportPath } = await writeTaskArtifacts(taskId, executionLog, reportContent);
  const relativeLogPath = path.relative(repoRoot, logPath);
  const relativeReportPath = path.relative(repoRoot, reportPath);
  const completedState = validationPassed
    ? completeTaskExecution(executionState, {
        commit,
        report: relativeReportPath,
        validation: validation.results,
      })
    : failTaskExecution(executionState, {
        reason: validation.error?.message ?? (hasCommands ? 'Validation failed' : 'No safe validation commands found'),
        validation: validation.results,
      });
  await saveJson(stateFile, completedState);

  try {
    const finalComment = buildFinalIssueComment({
      taskId,
      validationPassed,
      reportPath: relativeReportPath,
      logPath: relativeLogPath,
      commit,
      validation,
    });
    await commentOnIssue(repo, issue.number, finalComment);
    if (validationPassed) {
      await markIssueCompleted(repo, issue.number);
    } else {
      await markIssueFailed(repo, issue.number);
    }
  } catch (commentError) {
    console.error(`Issue reporting failed for ${taskId}: ${commentError?.message ?? commentError}`);
  }

  return {
    state: completedState,
    issue,
    taskId,
    dryRun: false,
    log: executionLog,
    reportPath: relativeReportPath,
    logPath: relativeLogPath,
    validation,
    commit,
  };
}

async function main() {
  const options = parseArgs(process.argv);
  const state = normalizeHermesState(await loadJson(stateFile, defaultHermesState()));
  const repo = await getRepoFullName();
  const issues = await listReadyIssues(repo);
  const runnable = selectRunnableIssue(issues, state);

  if (!runnable) {
    const output = {
      found: false,
      action: 'idle',
      repo,
      state,
    };
    if (options.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      console.log('No runnable TASK issue found.');
      console.log(JSON.stringify(output, null, 2));
    }
    return;
  }

  const issue = await viewIssue(repo, runnable.number);
  const result = await executeTask({ repo, issue, state, dryRun: options.dryRun });
  const summary = buildExecutionSummary({
    issue,
    repo,
    state: result.state,
    validation: result.validation?.results ?? result.validation,
    report: result.reportPath,
    commit: result.commit,
    execution: {
      dryRun: result.dryRun,
      logPath: result.logPath,
    },
  });

  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    console.log(`${result.dryRun ? 'Dry run for' : 'Completed'} ${summary.task_id} from issue #${issue.number}`);
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exitCode = 1;
});
