import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';

export const getTripChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chats = await Chat.find({ users: userId })
      .populate('trip_id', 'destination')
      .populate('users', 'name email profilePicture')
      .sort({ created_at: -1 });
    
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.users.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized or Chat not found' });
    }

    const messages = await Message.find({ chat_id: chatId })
      .populate('sender_id', 'name email profilePicture')
      .sort({ created_at: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const sender_id = req.user.userId;

    const sender = await User.findById(sender_id).select('isMessagingBlocked');
    if (sender?.isMessagingBlocked) {
      return res.status(403).json({ success: false, message: 'Messaging blocked by admin' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.users.includes(sender_id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized or Chat not found' });
    }

    const message = await Message.create({
      chat_id: chatId,
      sender_id,
      text
    });

    const populatedMessage = await message.populate('sender_id', 'name email profilePicture');
    const payload = {
      _id: String(populatedMessage._id),
      chat_id: String(chat._id),
      sender_id: populatedMessage.sender_id,
      text: populatedMessage.text,
      created_at: populatedMessage.created_at
    };

    // Notify other participants via socket
    const io = req.app.get('io');
    if (io) {
      io.to(String(chat._id)).emit('newMessage', payload);
    }

    res.status(201).json({ success: true, message: payload });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
