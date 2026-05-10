import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://localhost:3000/api/ai/status');
  const json = await res.json().catch(() => null);
  console.log('AI Status:', json);
}

main().catch((e) => { console.error(e); process.exit(1); });

