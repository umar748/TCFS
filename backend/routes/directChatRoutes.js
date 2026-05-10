import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/direct', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all conversations involving this user
    const conversations = await Conversation.find({
      participants: userId
    }).populate('participants', 'name profileImage');

    // Load blocked list to filter out blocked conversations
    const current = await User.findById(userId).select('blockedUsers');
    const blockedSet = new Set((current?.blockedUsers || []).map(x => x.toString()));

    if (!conversations) {
      return res.status(200).json({
        success: true,
        chats: []
      });
    }

    // Format the response with last message info
    const chats = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p._id.toString() !== userId.toString());
        if (!otherParticipant) return null;
        if (blockedSet.has(otherParticipant._id.toString())) return null;
        
        const lastMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: conv._id,
          participantId: otherParticipant._id,
          participantName: otherParticipant.name,
          participantImage: otherParticipant.profileImage,
          tripId: conv._id.toString(),
          tripName: `Chat with ${otherParticipant.name}`,
          lastMessage: lastMessage?.message || 'No messages yet',
          lastMessageTime: lastMessage?.createdAt || conv.createdAt,
          unreadCount: await Message.countDocuments({
            conversationId: conv._id,
            recipientId: userId,
            read: false
          })
        };
      })
    );

    res.status(200).json({
      success: true,
      chats: (chats.filter(Boolean))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get direct messages with a user
router.get('/direct/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    // Block check
    const [current, other] = await Promise.all([
      User.findById(currentUserId).select('blockedUsers'),
      User.findById(otherUserId).select('blockedUsers')
    ]);
    if (!current || !other) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const youBlocked = (current.blockedUsers || []).some(id => id.toString() === otherUserId);
    const theyBlocked = (other.blockedUsers || []).some(id => id.toString() === currentUserId.toString());
    if (youBlocked || theyBlocked) {
      return res.status(403).json({ success: false, message: 'Chat not available (user is blocked).' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId]
      });
    }

    // Get all messages in this conversation
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: conversation._id,
        recipientId: currentUserId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      messages: messages.map(msg => ({
        _id: msg._id,
        sender: {
          _id: msg.senderId._id,
          name: msg.senderId.name
        },
        message: msg.message,
        timestamp: msg.createdAt,
        read: msg.read
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a direct message
router.post('/direct/send', authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { recipientId, message } = req.body;

    // Block check
    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('blockedUsers'),
      User.findById(recipientId).select('blockedUsers')
    ]);
    if (!sender || !recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const youBlocked = (sender.blockedUsers || []).some(id => id.toString() === recipientId);
    const theyBlocked = (recipient.blockedUsers || []).some(id => id.toString() === senderId.toString());
    if (youBlocked || theyBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot send message. User is blocked.' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId]
      });
    }

    // Create message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      recipientId,
      message,
      read: false
    });

    await newMessage.populate('senderId', 'name profileImage');

    const io = req.app.get('io');
    if (io) {
      const roomId = [String(senderId), String(recipientId)].sort().join('-');
      io.to(roomId).emit('newDirectMessage', {
        _id: newMessage._id,
        sender: {
          _id: newMessage.senderId._id,
          name: newMessage.senderId.name
        },
        message: newMessage.message,
        timestamp: newMessage.createdAt,
        read: newMessage.read
      });
    }

    res.status(201).json({
      success: true,
      message: {
        _id: newMessage._id,
        sender: {
          _id: newMessage.senderId._id,
          name: newMessage.senderId.name
        },
        message: newMessage.message,
        timestamp: newMessage.createdAt,
        read: newMessage.read
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
