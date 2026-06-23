#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  buildPollingSummary,
  claimIssue,
  defaultHermesState,
  normalizeHermesState,
  selectRunnableIssue,
} from '../src/task-queue.js';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const stateFile = path.join(repoRoot, '.hermes', 'state.json');
const defaultLabels = ['pm:ready', 'hermes:ready'];

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    claim: args.has('--claim'),
    json: args.has('--json'),
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
      defaultLabels[0],
      '--label',
      defaultLabels[1],
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

async function main() {
  const options = parseArgs(process.argv);
  const state = normalizeHermesState(await loadJson(stateFile, defaultHermesState()));
  const repo = await getRepoFullName();
  const issues = await listReadyIssues(repo);
  const runnable = selectRunnableIssue(issues, state);

  if (!runnable) {
    const summary = buildPollingSummary({ issue: null, repo, state });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } else {
      console.log('No runnable TASK issue found.');
      console.log(JSON.stringify(summary, null, 2));
    }
    return;
  }

  if (options.claim) {
    const claimedState = claimIssue(runnable, state);
    await saveJson(stateFile, claimedState);
    const summary = buildPollingSummary({ issue: runnable, repo, state: claimedState });
    summary.action = 'claimed';
    if (options.json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } else {
      console.log(`Claimed ${summary.task_id} from issue #${runnable.number}`);
      console.log(JSON.stringify(summary, null, 2));
    }
    return;
  }

  const summary = buildPollingSummary({ issue: runnable, repo, state });
  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    console.log(`Found runnable ${summary.task_id} at issue #${runnable.number}`);
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exitCode = 1;
});
