(async () => {
  try {
    const base = 'http://localhost:3000';

    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmed@example.com', password: 'password123' })
    });
    const login = await loginRes.json();
    const token = login.token;
    if (!token) {
      console.error('Login failed', login);
      process.exit(1);
    }

    // Get trip chats
    const chatsRes = await fetch(`${base}/api/trip-chats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const chats = await chatsRes.json();
    if (!chats.chats || chats.chats.length === 0) {
      console.log('No trip chats found');
      return;
    }

    const chat = chats.chats[0];
    console.log('Using chat id:', chat._id, 'trip:', chat.trip_id?.destination);

    // Send message
    const text = 'Welcome aboard! Looking forward to the trip.';
    const sendRes = await fetch(`${base}/api/trip-chats/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chatId: chat._id, text })
    });
    const sendData = await sendRes.json();
    console.log('Send response:', sendData);

    // Fetch messages
    const msgsRes = await fetch(`${base}/api/trip-chats/${chat._id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgs = await msgsRes.json();
    console.log('Messages:', JSON.stringify(msgs, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
