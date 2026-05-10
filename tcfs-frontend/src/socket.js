import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';

if (!SOCKET_URL) {
  console.warn('Socket URL is not configured. Falling back to relative socket path.');
}

export const socket = io(SOCKET_URL || '/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected to socket server");
      socket.emit("join", userId);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔌 Socket disconnected");
  }
};
