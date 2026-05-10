import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const listMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createMatchRequest = async (req, res) => {
  try {
    const fromUserId = req.user.userId;
    const { toUserId, tripId, note } = req.body || {};
    if (!toUserId) {
      return res.status(400).json({ success: false, message: 'toUserId required' });
    }
    if (String(fromUserId) === String(toUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot send a request to yourself' });
    }

    const existing = await Notification.findOne({
      userId: toUserId,
      fromUserId,
      type: 'Match Request',
      read: false
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    const fromUser = await User.findById(fromUserId).select('name email');
    const message = `Match request from ${fromUser?.name || 'User'} <${fromUser?.email || ''}>` + (tripId ? ` for trip ${tripId}` : '') + (note ? `: ${note}` : '');
    const notif = await Notification.create({
      userId: toUserId,
      fromUserId,
      type: 'Match Request',
      message
    });
    const io = req.app.get('io');
    if (io) {
      io.to(String(toUserId)).emit('newNotification', {
        ...notif.toObject(),
        _id: notif._id
      });
    }
    res.status(201).json({ success: true, notificationId: String(notif._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const acceptNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const notif = await Notification.findOne({ _id: id, userId });
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notif.read = true;
    await notif.save();
    let partner = null;
    if (notif.fromUserId) {
      partner = await User.findById(notif.fromUserId);
    }
    if (!partner) {
      const regexEmail = /<(.+@.+)>/;
      const match = notif.message.match(regexEmail);
      if (match && match[1]) {
        partner = await User.findOne({ email: match[1] });
      }
    }
    let thread = null;
    if (partner) {
      thread = await Conversation.findOne({ participants: { $all: [userId, partner._id] } });
      if (!thread) {
        thread = await Conversation.create({ participants: [userId, partner._id] });
      }
      const existingIntro = await Message.findOne({ conversationId: thread._id });
      if (!existingIntro) {
        await Message.create({
          conversationId: thread._id,
          senderId: userId,
          recipientId: partner._id,
          message: "Hi, let's chat.",
          read: false,
          threadId: thread._id,
          content: "Hi, let's chat."
        });
      }

      const io = req.app.get('io');
      if (io && notif.fromUserId) {
        io.to(String(notif.fromUserId)).emit('requestAccepted', {
          conversationId: String(thread._id),
          partnerId: String(userId),
          partnerName: req.user.name || null
        });
      }
    }
    res.json({
      success: true,
      conversationId: thread ? String(thread._id) : null,
      threadId: thread ? String(thread._id) : null,
      partner: partner ? { id: partner._id, name: partner.name, email: partner.email } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
