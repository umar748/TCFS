import { Server } from 'socket.io';

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust this for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a private room based on user ID for notifications
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their private room`);
    });

    // Join a chat room for a specific trip
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat room: ${chatId}`);
    });

    // Join direct chat with another user
    socket.on('joinDirectChat', (data) => {
      const { userId, partnerId, tripId } = data;
      const roomId = [userId, partnerId].sort().join('-');
      socket.join(roomId);
      socket.join(userId); // Also join personal room
      console.log(`User ${userId} joined direct chat room: ${roomId}`);
    });

    // Send direct message
    socket.on('sendDirectMessage', (data) => {
      const { recipientId, message, timestamp } = data;
      const roomId = [data.userId, recipientId].sort().join('-');
      
      // Emit to all users in the chat room
      io.to(roomId).emit('newDirectMessage', {
        sender: { _id: data.userId },
        message,
        timestamp,
        read: false
      });

      // Notify recipient
      io.to(recipientId).emit('newMessage', {
        from: data.userId,
        message,
        timestamp
      });
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { partnerId } = data;
      const roomId = [data.userId, partnerId].sort().join('-');
      socket.to(roomId).emit('userTyping', {
        userId: data.userId
      });
    });

    socket.on('stoppedTyping', (data) => {
      const { partnerId } = data;
      const roomId = [data.userId, partnerId].sort().join('-');
      socket.to(roomId).emit('userStoppedTyping', {
        userId: data.userId
      });
    });

    // Mark messages as read
    socket.on('markDirectChatAsRead', (data) => {
      const { partnerId } = data;
      const roomId = [data.userId, partnerId].sort().join('-');
      io.to(roomId).emit('messagesRead', {
        userId: data.userId
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export default socketHandler;
