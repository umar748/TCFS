import { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaPaperPlane, FaSmile, FaPaperclip, FaPhone, FaVideo, FaEllipsisV, FaCheckDouble } from 'react-icons/fa';
import { io } from 'socket.io-client';

export default function DirectChat({ tripId, partnerId, partnerName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io('//', {
      reconnection: true,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Chat connected');
      // Join private room for this chat
      newSocket.emit('joinDirectChat', {
        userId: user.id,
        partnerId: partnerId,
        tripId: tripId
      });
    });

    // Listen for new messages
    newSocket.on('newDirectMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicator
    newSocket.on('userTyping', (data) => {
      if (data.userId === partnerId) {
        setIsTyping(true);
      }
    });

    newSocket.on('userStoppedTyping', (data) => {
      if (data.userId === partnerId) {
        setIsTyping(false);
      }
    });

    // Listen for message read receipts
    newSocket.on('messagesRead', () => {
      setMessages(prev =>
        prev.map(msg =>
          msg.sender._id === partnerId
            ? { ...msg, read: true }
            : msg
        )
      );
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [user.id, partnerId, tripId]);

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // Check block status
        const bs = await fetch('/api/users/blocked', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { blocked: [] }).catch(() => ({ blocked: [] }));
        const blockedList = bs.blocked || [];
        setIsBlocked(blockedList.some(u => (u._id || u.id) === partnerId));

        const response = await fetch(
          `/api/chat/direct/${partnerId}?tripId=${tripId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
        } else if (String(data?.message || '').toLowerCase().includes('blocked')) {
          setIsBlocked(true);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [partnerId, tripId, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || isBlocked) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Emit to socket for real-time delivery
      socket.emit('sendDirectMessage', {
        userId: user.id,
        recipientId: partnerId,
        tripId: tripId,
        message: messageContent,
        timestamp: new Date()
      });

      // Also save to database
      if (token) {
        await fetch('/api/chat/direct/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            recipientId: partnerId,
            tripId: tripId,
            message: messageContent
          })
        });
      }

      // Add to local state immediately
      setMessages(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          sender: { _id: user.id, name: user.name },
          message: messageContent,
          timestamp: new Date(),
          read: false
        }
      ]);

      // Stop typing indicator
      socket.emit('stoppedTyping', { userId: user.id, partnerId });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleBlock = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const method = isBlocked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${partnerId}/block`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setIsBlocked(!isBlocked);
      }
    } catch (e) {
      console.error('Block/unblock failed', e);
    } finally {
      setBusy(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (socket && !isTyping) {
      socket.emit('typing', { userId: user.id, partnerId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('stoppedTyping', { userId: user.id, partnerId });
      }
    }, 3000);
  };

  // Mark as read when viewing
  useEffect(() => {
    if (socket && messages.length > 0) {
      const unreadMessages = messages.filter(
        m => m.sender._id === partnerId && !m.read
      );
      if (unreadMessages.length > 0) {
        socket.emit('markDirectChatAsRead', { userId: user.id, partnerId });
      }
    }
  }, [messages, socket, partnerId, user.id]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <FaArrowLeft className="text-gray-400" size={20} />
          </button>
          <div>
            <h2 className="font-bold text-white">{partnerName}</h2>
            <p className="text-xs text-gray-400">Trip ID: {tripId.substring(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-700 rounded-lg transition">
            <FaPhone size={18} className="text-gray-400 hover:text-white" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition">
            <FaVideo size={18} className="text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={toggleBlock}
            disabled={busy}
            className={`px-3 py-1 rounded-lg transition ${isBlocked ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            title={isBlocked ? 'Unblock user' : 'Block user'}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition">
            <FaEllipsisV size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              💬
            </div>
            <p className="text-center">
              Ek nayi shuru karo baat-chit!<br/>
              <span className="text-sm">(Start a new conversation!)</span>
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender._id === user.id;
            return (
              <div
                key={msg._id || idx}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold text-gray-300 mb-1">
                      {msg.sender.name}
                    </p>
                  )}
                  <p className="break-words">{msg.message}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className="text-xs opacity-70">{formatTime(msg.timestamp)}</p>
                    {isOwn && msg.read && (
                      <FaCheckDouble size={12} className="opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <button
            type="button"
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <FaPaperclip size={20} className="text-blue-400" />
          </button>
          <input
            type="text"
            placeholder="Ek sandesh likho..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 outline-none disabled:opacity-50"
            disabled={isBlocked}
          />
          <button
            type="button"
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <FaSmile size={20} className="text-blue-400" />
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            disabled={isBlocked}
          >
            <FaPaperPlane size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
