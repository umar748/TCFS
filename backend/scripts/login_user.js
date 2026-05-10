import fetch from 'node-fetch';

const base = 'http://localhost:3000/api/auth';
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/login_user.js <email> <password>');
  process.exit(1);
}

async function run() {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  console.log('STATUS', res.status);
  console.log(JSON.stringify(body, null, 2));
}

run();
