#!/usr/bin/env node

/**
 * Environment-aware command runner for Kollimalai Arasan
 * 
 * Usage:
 *   node scripts/with-env.cjs <env-file> <command> [args...]
 * 
 * Examples:
 *   node scripts/with-env.cjs .env_dev next dev
 *   node scripts/with-env.cjs .env_test prisma generate
 *   node scripts/with-env.cjs .env_test next build --webpack
 *   node scripts/with-env.cjs .env_prod next start
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// 1. Validate arguments
const envFile = process.argv[2];
const cmdArgs = process.argv.slice(3);

if (!envFile || cmdArgs.length === 0) {
  console.error('[with-env] Error: Missing required arguments.');
  console.error('Usage: node scripts/with-env.cjs <env-file> <command> [args...]');
  console.error('Example: node scripts/with-env.cjs .env_dev next dev');
  process.exit(1);
}

// 2. Validate environment file existence
const fullPath = path.resolve(process.cwd(), envFile);
if (!fs.existsSync(fullPath)) {
  console.error(`[with-env] Error: Environment file "${envFile}" not found at "${fullPath}".`);
  console.error(`Please create it by copying the template: copy .env.example ${envFile}`);
  process.exit(1);
}

// 3. Parse environment file
const fileContent = fs.readFileSync(fullPath, 'utf8');
const parsed = dotenv.parse(fileContent);

// 4. Inject variables into process.env
// Host / server-provided environment variables take precedence (do not overwrite existing)
for (const [key, value] of Object.entries(parsed)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// Set active environment tracking indicators
process.env.ENV_FILE = envFile;
process.env.DOTENV_CONFIG_PATH = fullPath;

// Signal Next.js that the environment has been explicitly configured
// This prevents Next.js from reading/merging a stray root .env file
process.env.__NEXT_PROCESSED_ENV = 'true';

// 5. Ensure NODE_ENV complies with Next.js requirements
function formatArg(arg) {
  if (arg.length === 0) return '""';
  if (/[\s"']/.test(arg)) {
    if (!((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'")))) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
  }
  return arg;
}

const commandToRun = cmdArgs.length === 1 ? cmdArgs[0] : cmdArgs.map(formatArg).join(' ');
const isBuildOrStart = /next\s+(build|start)/.test(commandToRun);
const isDev = /next\s+dev/.test(commandToRun);

if (isBuildOrStart || process.env.APP_ENV === 'production') {
  if (process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'test') {
    console.warn('[with-env] Warning: Next.js production builds require NODE_ENV=production. Normalizing NODE_ENV.');
  }
  process.env.NODE_ENV = 'production';
} else if (isDev || process.env.APP_ENV === 'development') {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
}

// 6. Ensure node_modules/.bin is on PATH so binaries like `next` and `prisma` are found
const binPath = path.resolve(process.cwd(), 'node_modules', '.bin');
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
if (!process.env[pathKey]?.includes(binPath)) {
  process.env[pathKey] = `${binPath}${path.delimiter}${process.env[pathKey] || ''}`;
}

console.log(`[with-env] Loaded "${envFile}" (APP_ENV=${process.env.APP_ENV || 'unset'}, NODE_ENV=${process.env.NODE_ENV || 'default'})`);
console.log(`[with-env] Running: ${commandToRun}\n`);

// 7. Spawn child process
const child = spawn(commandToRun, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Forward termination signals
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
});
