import { spawn } from 'child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env
config({ path: resolve(root, '.env') });

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(tag, msg) {
  const colors = { app: '\x1b[36m', db: '\x1b[33m', rag: '\x1b[35m', ok: '\x1b[32m', err: '\x1b[31m', reset: '\x1b[0m' };
  const c = colors[tag] || colors.reset;
  console.log(`${c}[${tag.toUpperCase()}]${colors.reset} ${msg}`);
}

async function checkUrl(url, label, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch { /* retry */ }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

function runProcess(cmd, args, tag) {
  const isWindows = process.platform === 'win32';
  const proc = spawn(cmd, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
    env: { ...process.env },
  });

  proc.stdout.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => log(tag, line));
  });

  proc.stderr.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => log(tag, line));
  });

  proc.on('error', (err) => log('err', `${tag} failed to start: ${err.message}`));
  return proc;
}

// ── Pre-flight checks ───────────────────────────────────────────────────────

async function preflight() {
  console.log('\n\x1b[1m--- Nexus Platform: Starting All Services ---\x1b[0m\n');

  // 1. Check database
  log('db', 'Checking database connection...');
  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });
    await sql`SELECT 1`;
    await sql.end();
    log('ok', 'Database connected');
  } catch (e) {
    log('err', `Database connection failed: ${e.message}`);
    log('err', 'Check DATABASE_URL in .env');
    process.exit(1);
  }

  // 2. Check Qdrant
  log('rag', `Checking Qdrant at ${QDRANT_URL}...`);
  const qdrantOk = await checkUrl(QDRANT_URL, 'Qdrant', 2, 1000);
  if (qdrantOk) {
    log('ok', 'Qdrant connected');
  } else {
    log('err', `Qdrant not reachable at ${QDRANT_URL}`);
    log('err', 'RAG features will not work. Check QDRANT_URL and QDRANT_API_KEY in .env');
  }

  // 3. Check AI provider
  const provider = process.env.AI_PROVIDER || 'openai';
  const keyMap = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY' };
  const key = process.env[keyMap[provider]];
  if (key) {
    log('ok', `AI provider: ${provider} (key set)`);
  } else {
    log('err', `AI provider "${provider}" configured but ${keyMap[provider]} is missing`);
  }

  console.log('');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await preflight();

  // Run migrations
  log('db', 'Running database migrations...');
  const migrate = spawn('npx', ['drizzle-kit', 'migrate'], { cwd: root, stdio: 'inherit', shell: true });
  await new Promise((resolve) => migrate.on('close', resolve));
  log('ok', 'Migrations complete');

  console.log('');

  // Start Next.js dev server
  log('app', 'Starting Next.js dev server...');
  const app = runProcess('npx', ['next', 'dev'], 'app');

  // Wait for app to be ready, then trigger RAG backfill
  log('rag', 'Waiting for app to start before RAG backfill...');
  const appReady = await checkUrl(APP_URL, 'App', 15, 3000);

  if (appReady) {
    log('ok', `App running at ${APP_URL}`);

    // Trigger backfill
    try {
      log('rag', 'Running RAG backfill (syncing tasks to Qdrant)...');
      const res = await fetch(`${APP_URL}/api/rag/backfill`);
      if (res.ok) {
        const data = await res.json();
        log('ok', `Backfill done: ${data.success}/${data.total} tasks synced`);
      } else {
        log('err', `Backfill failed with status ${res.status}`);
      }
    } catch (e) {
      log('err', `Backfill request failed: ${e.message}`);
    }
  } else {
    log('err', 'App did not start in time. Skipping backfill.');
  }

  console.log('\n\x1b[1m--- All services ready ---\x1b[0m');
  console.log(`\x1b[36m  App:    ${APP_URL}\x1b[0m`);
  console.log(`\x1b[35m  Qdrant: ${QDRANT_URL}\x1b[0m\n`);

  // Handle shutdown
  const cleanup = () => {
    log('app', 'Shutting down...');
    app.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((e) => {
  log('err', e.message);
  process.exit(1);
});
