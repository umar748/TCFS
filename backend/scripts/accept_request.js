(async () => {
  try {
    const base = 'http://localhost:3000';

    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmed@example.com', password: 'password123' })
    });
    const login = await loginRes.json();
    console.log('Login success:', login.success);
    const token = login.token;
    if (!token) {
      console.error('No token received', login);
      process.exit(1);
    }

    const incRes = await fetch(`${base}/api/requests/incoming`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const inc = await incRes.json();
    console.log('Incoming requests count:', inc.requests ? inc.requests.length : 0);
    if (!inc.requests || inc.requests.length === 0) {
      console.log('No incoming requests to accept');
      return;
    }

    const pending = inc.requests.find(r => r.status === 'pending') || inc.requests[0];
    console.log('Accepting request id:', pending._id, 'status:', pending.status);

    const actRes = await fetch(`${base}/api/requests/${pending._id}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'accepted' })
    });
    const act = await actRes.json();
    console.log('Accept response:', act);

    const chatsRes = await fetch(`${base}/api/chat/direct`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const chats = await chatsRes.json();
    console.log('Direct chats:', JSON.stringify(chats, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
