import fetch from 'node-fetch';

async function run() {
  const base = 'http://localhost:3000/api/auth';
  const email = `tester${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  try {
    const reg = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tester', email, password, role: 'user' }),
    });
    const regJson = await reg.json().catch(() => null);
    console.log('REGISTER', reg.status, regJson);
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginJson = await login.json().catch(() => null);
    console.log('LOGIN', login.status, loginJson);
  } catch (e) {
    console.error('TEST ERROR', e.message);
  }
}

run();
