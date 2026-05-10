import AiChat from '../models/AiChat.js';
import User from '../models/User.js';
import { processChat } from '../services/aiService.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const handleChat = async (req, res) => {
  let { userId, message, location } = req.body;

  if (!message) return res.status(200).json({ success: true, message: "Please enter a message to continue." });

  try {
    if (!userId) {
      let demoUser = await User.findOne({ email: 'demo@tcfs.com' });
      if (!demoUser) {
        demoUser = await User.create({
          name: 'Demo User',
          email: 'demo@tcfs.com',
          password: 'demo',
          age: 25,
          gender: 'Prefer not to say'
        });
      }
      userId = demoUser._id;
    }

    try {
      await AiChat.create({
        userId,
        role: 'user',
        content: message
      });
    } catch (logError) {
      console.warn('Failed to save user AI chat message:', logError && (logError.stack || logError));
    }

    let aiResult;
    try {
      aiResult = await processChat(userId, message, location);
    } catch (aiError) {
      console.error('AI processing failed in controller:', aiError && (aiError.stack || aiError));
      aiResult = {
        response: "I'm in offline support mode right now, but I can still answer TCFS website questions, explain platform features, and help with travel safety or companion discovery.",
        data: null
      };
    }

    try {
      await AiChat.create({
        userId,
        role: 'assistant',
        content: aiResult.response
      });
    } catch (logError) {
      console.warn('Failed to save assistant AI chat message:', logError && (logError.stack || logError));
    }

    res.json({ success: true, response: aiResult.response, message: aiResult.response, data: aiResult.data || null });

  } catch (error) {
    console.error("ChatController Error:", error && (error.stack || error));
    const code = error && error.code ? error.code : 500;
    if (code === 429) {
      return res.status(200).json({ success: true, response: "Please wait a moment before sending another message.", message: "Please wait a moment before sending another message." });
    }
    const offline = "I'm in offline support mode right now, but I can still answer TCFS website questions, explain platform features, and help with travel safety or companion discovery.";
    return res.status(200).json({ success: true, response: offline, message: offline });
  }
};

export const getHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const history = await AiChat.find({ userId }).sort({ timestamp: 1 });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};

export const createThread = async (req, res) => {
  try {
    const me = req.user.userId;
    const { peerId } = req.body;
    if (!peerId) return res.status(400).json({ success: false, message: 'peerId required' });
    const peer = await User.findById(peerId);
    if (!peer) return res.status(404).json({ success: false, message: 'User not found' });
    let thread = await Conversation.findOne({ participants: { $all: [me, peerId] } });
    if (!thread) thread = await Conversation.create({ participants: [me, peerId] });
    res.json({ success: true, threadId: String(thread._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const listThreads = async (req, res) => {
  try {
    const me = req.user.userId;
    const threads = await Conversation.find({ participants: me }).sort({ createdAt: -1 });
    const items = [];
    for (const t of threads) {
      const ids = t.participants.map(String);
      const otherId = ids.find(id => id !== String(me));
      const other = otherId ? await User.findById(otherId).select('name email') : null;
      const lastMsg = await Message.findOne({ threadId: t._id }).sort({ createdAt: -1 });
      items.push({
        id: String(t._id),
        partner: other ? { id: String(other._id), name: other.name, email: other.email } : null,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null
      });
    }
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const listMessages = async (req, res) => {
  try {
    const me = req.user.userId;
    const { id } = req.params;
    const t = await Conversation.findById(id);
    if (!t || !t.participants.map(String).includes(String(me))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const msgs = await Message.find({ threadId: id }).sort({ createdAt: 1 });
    res.json({ success: true, messages: msgs.map(m => ({ id: String(m._id), senderId: String(m.senderId), content: m.content, createdAt: m.createdAt })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const me = req.user.userId;
    const { id } = req.params;
    const { content } = req.body;
    const t = await Conversation.findById(id);
    if (!t || !t.participants.map(String).includes(String(me))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'content required' });
    const msg = await Message.create({ threadId: id, senderId: me, content: content.trim() });
    res.json({ success: true, message: { id: String(msg._id), senderId: String(msg.senderId), content: msg.content, createdAt: msg.createdAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
