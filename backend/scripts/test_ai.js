import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://localhost:3000/api/chat/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'About TCFS' }),
  });
  const json = await res.json().catch(() => null);
  console.log('Status:', res.status);
  console.log('JSON:', json);
}

main().catch((e) => { console.error(e); process.exit(1); });

