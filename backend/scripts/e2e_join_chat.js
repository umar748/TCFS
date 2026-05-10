import fetch from 'node-fetch';

const base = 'http://localhost:3000';

async function api(path, method, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  const nouEmail = `nouman${Date.now()}@example.com`;
  const umarEmail = `umar${Date.now()}@example.com`;
  const password = 'Passw0rd!';

  // Register Nouman
  const regN = await api('/api/auth/register', 'POST', null, { name: 'nouman wajid', email: nouEmail, password, role: 'user' });
  if (!regN.json?.success) {
    console.error('Register Nouman failed', regN.status, regN.json);
    process.exit(1);
  }
  const nouToken = `Bearer ${regN.json.token}`;

  // Register Umar
  const regU = await api('/api/auth/register', 'POST', null, { name: 'umar', email: umarEmail, password, role: 'user' });
  if (!regU.json?.success) {
    console.error('Register Umar failed', regU.status, regU.json);
    process.exit(1);
  }
  const umarToken = `Bearer ${regU.json.token}`;

  // Ensure Nouman has a trip
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const tripRes = await api('/api/trips', 'POST', nouToken, {
    destination: 'Demo Skardu',
    start_date: start,
    end_date: end,
    budget: 1200,
    description: 'Demo trip for chat flow',
    interests: ['Hiking', 'Photography'],
  });
  if (!tripRes.json?.success) {
    console.error('Create trip failed', tripRes.status, tripRes.json);
    process.exit(1);
  }
  const tripId = tripRes.json.trip._id;
  console.log('Trip created:', tripId);

  // Umar sends join request
  const reqRes = await api('/api/requests/send', 'POST', umarToken, {
    trip_id: tripId,
    message: 'Assalam-u-Alaikum, I want to join this trip.',
  });
  if (!reqRes.json?.success) {
    console.error('Send request failed', reqRes.status, reqRes.json);
    process.exit(1);
  }
  const requestId = reqRes.json.request._id;
  console.log('Request sent:', requestId);

  // Nouman accepts
  const accRes = await api(`/api/requests/${requestId}/action`, 'PUT', nouToken, {
    action: 'accepted',
  });
  if (!accRes.json?.success) {
    console.error('Accept request failed', accRes.status, accRes.json);
    process.exit(1);
  }
  let chatId = accRes.json.chat_id;
  if (!chatId) {
    const chatsN = await api('/api/trip-chats', 'GET', nouToken);
    const found = Array.isArray(chatsN.json?.chats) ? chatsN.json.chats.find(c => String(c.trip_id?._id || c.tripId) === String(tripId)) : null;
    chatId = found?._id;
  }
  console.log('Request accepted, chat:', chatId);

  // Send messages in the chat
  const msg1 = await api('/api/trip-chats/send', 'POST', nouToken, {
    chatId,
    text: 'Assalam-u-Alaikum',
  });
  console.log('Nouman message:', msg1.status, msg1.json?.success);

  const msg2 = await api('/api/trip-chats/send', 'POST', umarToken, {
    chatId,
    text: 'Walikum Salam',
  });
  console.log('Umar message:', msg2.status, msg2.json?.success);
}

main().catch((e) => {
  console.error('E2E flow error', e);
  process.exit(1);
});
