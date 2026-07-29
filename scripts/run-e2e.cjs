const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function waitForServer(attempts = 50) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get('http://127.0.0.1:3000', response => {
        response.resume();
        if (response.statusCode === 200) return resolve();
        retry();
      });
      request.on('error', retry);
      request.setTimeout(1000, () => request.destroy());
    };
    const retry = () => {
      if (--attempts <= 0) return reject(new Error('El servidor E2E no inicio en el puerto 3000'));
      setTimeout(check, 200);
    };
    check();
  });
}

async function main() {
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/react-scripts/bin/react-scripts.js'), 'build'], {
    cwd: root,
    env: { ...process.env, REACT_APP_API_URL: 'http://localhost:3001/api' },
    stdio: 'inherit',
  });
  if (build.status !== 0) process.exit(build.status || 1);

  let server;
  try {
    await waitForServer(1);
  } catch {
    server = spawn(process.execPath, [path.join(root, 'scripts/serve-build.cjs')], {
      cwd: root,
      env: { ...process.env, PORT: '3000' },
      stdio: 'inherit',
    });
  }

  const stop = () => {
    if (server && !server.killed) server.kill();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    await waitForServer();
    const tests = spawnSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test'], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_SKIP_WEBSERVER: '1' },
      stdio: 'inherit',
    });
    process.exitCode = tests.status || 0;
  } finally {
    stop();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
