const { spawn } = require('child_process');
const path = require('path');

const exe = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
console.log('Spawning:', exe);

const child = spawn(exe, ['--enable-logging'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (d) => {
  console.log('[STDOUT]', d.toString().trim());
});

child.stderr.on('data', (d) => {
  console.log('[STDERR]', d.toString().trim());
});

child.on('error', (err) => {
  console.error('[SPAWN ERROR]', err);
});

child.on('exit', (code, sig) => {
  console.log(`[EXIT] Child exited with code: ${code}, signal: ${sig}`);
  process.exit(0);
});

setTimeout(() => {
  console.log('[MONITOR] Child still alive after 15 seconds! PID:', child.pid);
}, 15000);
