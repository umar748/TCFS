import fetch from 'node-fetch';

const base = 'http://localhost:3000/api/auth';
const name = process.argv[2] || 'User';
const email = process.argv[3];
const password = process.argv[4];

if (!email || !password) {
  console.error('Usage: node scripts/register_user.js <name> <email> <password>');
  process.exit(1);
}

async function run() {
  const reg = await fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: 'user' }),
  });
  const body = await reg.json().catch(() => null);
  console.log('STATUS', reg.status);
  console.log(JSON.stringify(body, null, 2));
}

run();
