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
  const nouEmail = 'noumn wajid12@gmail.com';
  const umarEmail = 'umar12@gmail.com';

  // Auth via google-demo to mint tokens for these emails
  const nouAuth = await api('/api/auth/google-demo', 'POST', null, { name: 'Nouman Wajid', email: nouEmail });
  if (!nouAuth.json?.success) {
    console.error('Auth Nouman failed', nouAuth.status, nouAuth.json);
    process.exit(1);
  }
  const nouToken = `Bearer ${nouAuth.json.token}`;

  const umarAuth = await api('/api/auth/google-demo', 'POST', null, { name: 'Umar', email: umarEmail });
  if (!umarAuth.json?.success) {
    console.error('Auth Umar failed', umarAuth.status, umarAuth.json);
    process.exit(1);
  }
  const umarToken = `Bearer ${umarAuth.json.token}`;

  // Create trip by Umar (so Umar will accept later)
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const tripRes = await api('/api/trips', 'POST', umarToken, {
    destination: 'Skardu Demo',
    start_date: start,
    end_date: end,
    budget: 1500,
    description: 'Testing chat flow with Skardu demo',
    interests: ['Hiking', 'Cultural'],
  });
  if (!tripRes.json?.success) {
    console.error('Create trip failed', tripRes.status, tripRes.json);
    process.exit(1);
  }
  const tripId = tripRes.json.trip._id;
  console.log('Trip created by Umar:', tripId);

  // Nouman sends join request
  const reqRes = await api('/api/requests/send', 'POST', nouToken, {
    trip_id: tripId,
    message: 'Assalam-u-Alaikum, I want to join.',
  });
  if (!reqRes.json?.success) {
    console.error('Send request failed', reqRes.status, reqRes.json);
    process.exit(1);
  }
  const requestId = reqRes.json.request._id;
  console.log('Request sent by Nouman:', requestId);

  // Umar accepts
  const accRes = await api(`/api/requests/${requestId}/action`, 'PUT', umarToken, { action: 'accepted' });
  if (!accRes.json?.success) {
    console.error('Accept request failed', accRes.status, accRes.json);
    process.exit(1);
  }
  let chatId = accRes.json.chat_id;
  if (!chatId) {
    const chatsU = await api('/api/trip-chats', 'GET', umarToken);
    const found = Array.isArray(chatsU.json?.chats) ? chatsU.json.chats.find(c => String(c.trip_id?._id || c.tripId) === String(tripId)) : null;
    chatId = found?._id;
  }
  console.log('Request accepted, chat:', chatId);

  // Chat messages
  const msg1 = await api('/api/trip-chats/send', 'POST', nouToken, { chatId, text: 'Assalam-u-Alaikum' });
  console.log('Nouman message:', msg1.status, msg1.json?.success);
  const msg2 = await api('/api/trip-chats/send', 'POST', umarToken, { chatId, text: 'Walikum Salam' });
  console.log('Umar message:', msg2.status, msg2.json?.success);
}

main().catch((e) => {
  console.error('E2E emails flow error', e);
  process.exit(1);
});

