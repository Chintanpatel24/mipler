#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function log(message) {
  process.stdout.write(`[mipler] ${message}\n`);
}

function warn(message) {
  process.stderr.write(`[mipler] ${message}\n`);
}

function ensureNodeVersion() {
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) {
    throw new Error(`Node.js v18+ required, found v${process.versions.node}`);
  }
}

function commandExists(command, args = ['--version']) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      stdio: 'ignore',
    });

    child.on('error', () => resolvePromise(false));
    child.on('exit', (code) => resolvePromise(code === 0));
  });
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function collectLatestMtime(targetPath) {
  if (!existsSync(targetPath)) return 0;

  const stat = statSync(targetPath);
  if (!stat.isDirectory()) return stat.mtimeMs;

  let latest = stat.mtimeMs;
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    latest = Math.max(latest, collectLatestMtime(join(targetPath, entry.name)));
  }
  return latest;
}

function needsBuild() {
  const distEntry = join(packageRoot, 'dist', 'index.html');
  if (!existsSync(distEntry)) return true;

  const distMtime = statSync(distEntry).mtimeMs;
  const sourceTargets = [
    join(packageRoot, 'src'),
    join(packageRoot, 'public'),
    join(packageRoot, 'index.html'),
    join(packageRoot, 'vite.config.ts'),
  ];

  return sourceTargets.some((target) => collectLatestMtime(target) > distMtime);
}

function canBuild() {
  return existsSync(join(packageRoot, 'node_modules', 'vite'));
}

async function ensureDependencies() {
  if (existsSync(join(packageRoot, 'node_modules'))) return;
  log('Installing Node dependencies...');
  await run(npmCmd, ['install']);
}

async function ensureBuild() {
  if (!needsBuild()) return;

  if (!canBuild()) {
    if (!existsSync(join(packageRoot, 'dist', 'index.html'))) {
      throw new Error('Build artifacts are missing. Run npm install in the project once before launching Mipler.');
    }
    warn('Source files are newer than dist/, but build tooling is unavailable here. Serving the existing build.');
    return;
  }

  log('Building the frontend...');
  await run(npmCmd, ['run', 'build']);
}

async function fetchWithTimeout(url, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function detectBackendCommand() {
  const candidates = isWindows
    ? [
        { command: 'py', prefixArgs: ['-3'] },
        { command: 'python', prefixArgs: [] },
      ]
    : [
        { command: 'python3', prefixArgs: [] },
        { command: 'python', prefixArgs: [] },
      ];

  for (const candidate of candidates) {
    const exists = await commandExists(candidate.command);
    if (!exists) continue;

    const canImportFastApi = await commandExists(candidate.command, [
      ...candidate.prefixArgs,
      '-c',
      'import fastapi',
    ]);

    if (canImportFastApi) {
      return candidate;
    }
  }

  return null;
}

function spawnManaged(command, args, envOverrides = {}) {
  const child = spawn(command, args, {
    cwd: packageRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
      PYTHONUNBUFFERED: '1',
    },
  });

  child.on('error', (error) => {
    warn(`${command} failed: ${error.message}`);
  });

  return child;
}

async function ensureBackend(children) {
  const backendHealthy = await fetchWithTimeout('http://127.0.0.1:8765/api/health');
  if (backendHealthy) {
    log('Using existing Python backend on http://127.0.0.1:8765');
    return;
  }

  const candidate = await detectBackendCommand();
  if (!candidate) {
    warn('Python backend not started. Install Python + FastAPI requirements if you want investigation execution.');
    return;
  }

  log(`Starting Python backend with ${candidate.command}...`);
  const backend = spawnManaged(candidate.command, [
    ...candidate.prefixArgs,
    '-m',
    'backend.api.server',
  ]);
  children.push(backend);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const healthy = await fetchWithTimeout('http://127.0.0.1:8765/api/health');
    if (healthy) {
      log('Python backend running at http://127.0.0.1:8765');
      return;
    }

    if (backend.exitCode !== null) {
      warn('Python backend exited before becoming ready.');
      return;
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }

  warn('Python backend did not become ready in time. The UI will still open, but backend workflows may fail.');
}

function stopChildren(children) {
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill();
    }
  }
}

async function main() {
  ensureNodeVersion();
  await ensureDependencies();
  await ensureBuild();

  const children = [];
  await ensureBackend(children);

  const port = process.env.PORT || '3000';
  const host = process.env.HOST || '127.0.0.1';

  log(`Starting Mipler on http://localhost:${port}`);
  log('Press Ctrl+C to stop');

  const frontend = spawnManaged(process.execPath, ['server.js'], {
    PORT: port,
    HOST: host,
  });
  children.push(frontend);

  const shutdown = () => {
    stopChildren(children);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);

  frontend.on('exit', (code) => {
    stopChildren(children.filter((child) => child !== frontend));
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  warn(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
