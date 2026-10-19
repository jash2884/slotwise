import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';

const state = `.wrangler/test-${randomUUID()}`;
const wrangler = ['--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js'];
const run = (args, env = process.env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(Error(`Child exited ${code}`)));
});

for (const sql of (await readdir('drizzle')).filter(file => file.endsWith('.sql')).sort()) {
  await run([...wrangler, 'd1', 'execute', 'DB', '--local', '--config',
    'dist/server/wrangler.json', '--persist-to', state, '--file', `drizzle/${sql}`]);
}

const server = spawn(process.execPath, [...wrangler, 'dev', '--config',
  'dist/server/wrangler.json', '--local', '--persist-to', state,
  '--ip', '127.0.0.1', '--inspector-port', '0', '--port', '5174'],
  { stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
let lastRuntimeChange = Date.now();
let serverError;
for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', chunk => {
    logs = (logs + chunk).slice(-16000);
    if (/ready on|reloading|updated and ready/i.test(chunk)) lastRuntimeChange = Date.now();
  });
}
server.on('error', error => { serverError = error; });

try {
  let healthySince = null;
  let ready = false;
  // Wrangler can briefly serve requests before its initial watcher reload and lazy module initialization.
  // Require a sustained healthy interval so mutation tests never race that reload.
  for (let attempt = 0; attempt < 120; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw Error(`Test server exited ${server.exitCode}`);
    try {
      // Warm lazy route modules using requests that cannot mutate data:
      // anonymous mutation requests must be rejected before input/database work.
      for (const path of ['/api/profile', '/api/bookings', '/api/demo', '/api/slots']) {
        const probe = await fetch('http://127.0.0.1:5174' + path, {
          method: 'POST', signal: AbortSignal.timeout(2000),
        });
        const result = await probe.json();
        if (probe.status !== 401 || !result.error) throw Error('Route is not ready');
      }
      const response = await fetch('http://127.0.0.1:5174/api/state', {
        signal: AbortSignal.timeout(2000),
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.mentors)) throw Error('Server is not ready');
      healthySince ??= Date.now();
      if (Date.now() - Math.max(healthySince, lastRuntimeChange) >= 2000) {
        ready = true;
        break;
      }
    } catch {
      healthySince = null;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw Error('Test server did not stabilize. Ensure port 5174 is free.');
  await run(['tests/api.integration.mjs'], {
    ...process.env, SLOTWISE_TEST_URL: 'http://127.0.0.1:5174',
  });
} catch (error) {
  console.error('Local Worker output:\n' + logs);
  throw error;
} finally {
  server.kill('SIGTERM');
}
