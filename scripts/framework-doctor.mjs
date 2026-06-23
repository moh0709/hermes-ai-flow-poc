#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const REQUIRED_FILES = [
  'README.md',
  'AGENT.md',
  '.hermes/state.json',
  'scripts/task-poller.mjs',
  'scripts/task-worker.mjs',
  'scripts/framework-doctor.mjs',
  'src/task-queue.js',
  'docs/FRAMEWORK_OVERVIEW.md',
  'docs/SETUP_GUIDE.md',
  'docs/ROLE_MODEL.md',
  'docs/GITHUB_ISSUE_PROTOCOL.md',
  'docs/HERMES_WORKER_SETUP.md',
  'docs/TASK_LIFECYCLE.md',
  'docs/LOGGING_AND_REPORTING.md',
  'docs/REUSE_IN_OTHER_PROJECTS.md',
  'docs/EVERYTHINGAI_ADOPTION_PLAN.md',
  'templates/ISSUE_TEMPLATE_TASK.md',
  'templates/ISSUE_TEMPLATE_BUGFIX.md',
  'templates/ISSUE_TEMPLATE_REVIEW.md',
  'templates/REPORT_TEMPLATE.md',
  'templates/STATE_TEMPLATE.json',
  'skills/hermes-pm-framework.skill.md',
  'skills/hermes-pm-framework.prompt.json',
];

const REQUIRED_DIRS = ['LOGS', 'REPORTS', 'docs', 'templates', 'skills', '.hermes', 'scripts', 'src'];
const REQUIRED_LABELS = ['pm:ready', 'hermes:ready', 'hermes:working', 'hermes:blocked', 'hermes:done', 'pm:review'];
const REQUIRED_PACKAGE_SCRIPTS = ['worker:once', 'worker:watch', 'framework:doctor', 'test', 'lint'];

function line(status, message) {
  return { status, message };
}

async function exists(relativePath) {
  try {
    await access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  const raw = await readFile(path.join(repoRoot, relativePath), 'utf8');
  return JSON.parse(raw);
}

async function run(command, args) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error?.stdout ?? '').trim(),
      stderr: String(error?.stderr ?? error?.message ?? error).trim(),
    };
  }
}

async function checkRequiredFiles() {
  const results = [];
  for (const file of REQUIRED_FILES) {
    results.push(line((await exists(file)) ? 'pass' : 'fail', `${file} exists`));
  }
  return results;
}

async function checkRequiredDirs() {
  const results = [];
  for (const dir of REQUIRED_DIRS) {
    results.push(line((await exists(dir)) ? 'pass' : 'fail', `${dir}/ exists`));
  }
  return results;
}

async function checkJsonFiles() {
  const results = [];
  for (const file of ['.hermes/state.json', 'templates/STATE_TEMPLATE.json', 'skills/hermes-pm-framework.prompt.json', 'package.json']) {
    try {
      await readJson(file);
      results.push(line('pass', `${file} is valid JSON`));
    } catch (error) {
      results.push(line('fail', `${file} is invalid JSON: ${error.message}`));
    }
  }
  return results;
}

async function checkPackageScripts() {
  const results = [];
  try {
    const pkg = await readJson('package.json');
    for (const script of REQUIRED_PACKAGE_SCRIPTS) {
      results.push(line(pkg.scripts?.[script] ? 'pass' : 'fail', `package script ${script} exists`));
    }
  } catch (error) {
    results.push(line('fail', `package.json could not be read: ${error.message}`));
  }
  return results;
}

async function checkGithubCli() {
  const results = [];
  const ghVersion = await run('gh', ['--version']);
  results.push(line(ghVersion.ok ? 'pass' : 'warn', ghVersion.ok ? 'gh CLI is installed' : 'gh CLI is not available in this environment'));

  if (!ghVersion.ok) {
    return results;
  }

  const auth = await run('gh', ['auth', 'status']);
  results.push(line(auth.ok ? 'pass' : 'warn', auth.ok ? 'gh auth status is available' : 'gh auth status failed'));

  const repo = await run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  results.push(line(repo.ok ? 'pass' : 'warn', repo.ok ? `gh can access repo ${repo.stdout}` : 'gh could not resolve current repo'));

  if (repo.ok) {
    const labels = await run('gh', ['label', 'list', '--json', 'name']);
    if (labels.ok) {
      try {
        const labelNames = new Set(JSON.parse(labels.stdout).map((item) => item.name));
        for (const label of REQUIRED_LABELS) {
          results.push(line(labelNames.has(label) ? 'pass' : 'warn', `GitHub label ${label} exists`));
        }
      } catch (error) {
        results.push(line('warn', `Could not parse GitHub label list: ${error.message}`));
      }
    } else {
      results.push(line('warn', 'Could not list GitHub labels'));
    }
  }

  return results;
}

async function checkArtifactDirsReadable() {
  const results = [];
  for (const dir of ['LOGS', 'REPORTS']) {
    try {
      const entries = await readdir(path.join(repoRoot, dir));
      results.push(line('pass', `${dir}/ readable with ${entries.length} entries`));
    } catch (error) {
      results.push(line('fail', `${dir}/ is not readable: ${error.message}`));
    }
  }
  return results;
}

async function main() {
  const checks = [
    ...(await checkRequiredFiles()),
    ...(await checkRequiredDirs()),
    ...(await checkJsonFiles()),
    ...(await checkPackageScripts()),
    ...(await checkArtifactDirsReadable()),
    ...(await checkGithubCli()),
  ];

  const summary = {
    status: checks.some((check) => check.status === 'fail') ? 'fail' : 'pass',
    passed: checks.filter((check) => check.status === 'pass').length,
    warnings: checks.filter((check) => check.status === 'warn').length,
    failed: checks.filter((check) => check.status === 'fail').length,
    checks,
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = summary.status === 'pass' ? 0 : 1;
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exitCode = 1;
});
