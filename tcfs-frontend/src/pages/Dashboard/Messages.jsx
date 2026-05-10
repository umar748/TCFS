import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { getToken, getUser } from '../../services/auth';
import { socket } from '../../socket';
import { FaPaperPlane, FaUser, FaComments, FaArrowLeft, FaSearch } from 'react-icons/fa';
import clsx from 'clsx';

export default function Messages() {
  const navigate = useNavigate();
  const user = getUser();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialChatId = params.get('chatId');
  const initialConversationId = params.get('conversationId');
  const initialPartnerId = params.get('partnerId');
  const initialPartnerName = params.get('partnerName');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const endRef = useRef(null);
  const containerRef = useRef(null);

  const fetchChats = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token || ''}` };
      const [tripRes, directRes] = await Promise.all([
        fetch('/api/trip-chats', { headers }),
        fetch('/api/chat/direct', { headers })
      ]);
      const tripData = await tripRes.json().catch(() => ({}));
      const directData = await directRes.json().catch(() => ({}));

      const normalizedTripChats = (tripData.chats || []).map((chat) => ({
        ...chat,
        type: 'trip',
        title: chat.trip_id?.destination || 'Trip Chat',
        subtitle: `${chat.users?.length || 0} participants`
      }));

      const normalizedDirectChats = (directData.chats || []).map((chat) => ({
        ...chat,
        type: 'direct',
        title: chat.participantName || 'Direct Chat',
        subtitle: chat.lastMessage || 'Start your conversation',
        users: [{ _id: chat.participantId, name: chat.participantName }]
      }));

      const combinedChats = [...normalizedDirectChats, ...normalizedTripChats];
      setChats(combinedChats);

      const preselected = combinedChats.find((chat) =>
        (initialConversationId && chat.type === 'direct' && chat._id === initialConversationId) ||
        (initialPartnerId && chat.type === 'direct' && String(chat.participantId) === String(initialPartnerId)) ||
        (initialChatId && chat.type === 'trip' && chat._id === initialChatId)
      );

      if (preselected) {
        setSelectedChat(preselected);
      } else if (initialPartnerId) {
        setSelectedChat({
          _id: `direct-${initialPartnerId}`,
          type: 'direct',
          participantId: initialPartnerId,
          participantName: initialPartnerName || 'Direct Chat',
          title: initialPartnerName || 'Direct Chat',
          subtitle: 'Start your conversation',
          tripId: initialPartnerId,
          users: [{ _id: initialPartnerId, name: initialPartnerName || 'Direct Chat' }]
        });
      } else if (combinedChats.length > 0 && !selectedChat) {
        setSelectedChat(combinedChats[0]);
      }
      return combinedChats;
    } catch (error) {
      console.error("Error fetching chats", error);
    }
  };

  const fetchMessages = async (chat) => {
    if (!chat) return;
    setLoading(true);
    try {
      const token = getToken();
      const endpoint = chat.type === 'direct'
        ? `/api/chat/direct/${chat.participantId}?tripId=${chat.tripId || chat._id}`
        : `/api/trip-chats/${chat._id}/messages`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    const scrollFn = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    scrollFn();
    setTimeout(scrollFn, 120);
    setTimeout(scrollFn, 300);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    const handler = (payload) => {
      fetchChats().then((list) => {
        if (Array.isArray(list)) {
          const found = list.find((c) =>
            (payload?.chat_id && c.type === 'trip' && c._id === payload.chat_id) ||
            (payload?.conversationId && c.type === 'direct' && c._id === payload.conversationId) ||
            (payload?.partnerId && c.type === 'direct' && String(c.participantId) === String(payload.partnerId))
          );
          if (found) setSelectedChat(found);
        }
      });
    };
    socket.on('requestAccepted', handler);
    return () => {
      socket.off('requestAccepted', handler);
    };
  }, [chats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      if (user?.id || user?.userId) {
        socket.connect();
        socket.emit('join', String(user?.id || user?.userId));
      }
      if (selectedChat.type === 'trip') {
        socket.emit('joinChat', selectedChat._id);
      } else if (selectedChat.type === 'direct') {
        socket.emit('joinDirectChat', {
          userId: String(user?.id || user?.userId),
          partnerId: String(selectedChat.participantId),
          tripId: String(selectedChat.tripId || selectedChat._id)
        });
      }

      const handleNewMessage = (message) => {
        const incomingChatId = String(message?.chat_id?._id || message?.chat_id || '');
        const selectedChatId = String(selectedChat._id || '');
        if (selectedChat.type === 'trip' && incomingChatId === selectedChatId) {
          setMessages((prev) => {
            const exists = prev.some((item) => String(item._id) === String(message._id));
            return exists ? prev : [...prev, message];
          });
          fetchChats();
          scrollToBottom();
          return;
        }
        fetchChats();
      };

      const handleNewDirectMessage = (message) => {
        if (selectedChat.type === 'direct') {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('newDirectMessage', handleNewDirectMessage);
      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('newDirectMessage', handleNewDirectMessage);
      };
    }
  }, [selectedChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedChat) return;

    const val = text.trim();
    setText('');
    scrollToBottom();

    try {
      const token = getToken();
      const endpoint = selectedChat.type === 'direct'
        ? '/api/chat/direct/send'
        : '/api/trip-chats/send';
      const body = selectedChat.type === 'direct'
        ? {
            recipientId: selectedChat.participantId,
            message: val
          }
        : {
            chatId: selectedChat._id,
            text: val
          };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        if (data.message) {
          if (selectedChat.type === 'direct') {
            setMessages((prev) => [...prev, data.message]);
          }
          fetchChats();
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const q = searchQuery.toLowerCase();
    return (
      String(chat.title || '').toLowerCase().includes(q) ||
      String(chat.subtitle || '').toLowerCase().includes(q) ||
      (chat.users || []).some((u) => u.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <TopNav onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex gap-6 overflow-hidden">
        <Sidebar className={!sidebarOpen ? 'hidden' : ''} />

        <main className="flex-1 py-8 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex-1 bg-gray-950 rounded-2xl shadow-2xl border border-gray-800 flex overflow-hidden">
            
            {/* Chats Sidebar */}
            <div className="w-80 border-r border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <FaComments className="text-blue-400" />
                  Messages
                </h2>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input 
                    type="text" 
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-500 hover:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No chats found
                  </div>
                ) : (
                  filteredChats.map(chat => {
                    const otherUsers = (chat.users || []).filter(u => u._id !== (user?.userId || user?.id));
                    const chatName = chat.type === 'direct'
                      ? (chat.participantName || chat.title || 'Direct Chat')
                      : (otherUsers.length > 0 ? otherUsers.map(u => u.name).join(', ') : 'Trip Chat');
                    
                    return (
                      <button 
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={clsx(
                          "w-full p-4 flex items-start gap-3 border-b border-gray-800 transition-all hover:bg-gray-900",
                          selectedChat?._id === chat._id && "bg-blue-500/10 border-l-4 border-l-blue-500"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center font-bold shrink-0">
                          {chatName.charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-bold text-sm text-white truncate">{chatName}</p>
                          <p className="text-xs text-blue-400 font-semibold truncate">{chat.type === 'direct' ? chat.subtitle : chat.trip_id?.destination}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-900">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-green-600 text-white border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        {(selectedChat.type === 'direct'
                          ? selectedChat.participantName
                          : selectedChat.trip_id?.destination || 'C').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">
                          {selectedChat.type === 'direct' ? selectedChat.participantName : selectedChat.trip_id?.destination}
                        </h3>
                        <p className="text-xs text-gray-200">
                          {selectedChat.type === 'direct'
                            ? 'Direct conversation'
                            : `${selectedChat.users.length} participants`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const senderId = m.sender_id?._id || m.sender?._id || m.senderId;
                        const senderName = m.sender_id?.name || m.sender?.name || selectedChat.participantName;
                        const messageText = m.text || m.message || m.content;
                        const createdAt = m.created_at || m.timestamp || m.createdAt;
                        const isMe = String(senderId) === String(user?.userId || user?.id);
                        return (
                          <div 
                            key={m._id || idx} 
                            className={clsx(
                              "flex flex-col",
                              isMe ? "items-end" : "items-start"
                            )}
                          >
                            {!isMe && (
                              <p className="text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase">
                                {senderName}
                              </p>
                            )}
                            <div 
                              className={clsx(
                                "max-w-[70%] p-3 rounded-2xl shadow-lg",
                                isMe 
                                  ? "bg-blue-600 text-white rounded-br-none hover:bg-blue-700 transition-all" 
                                  : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none hover:bg-gray-700 transition-all"
                              )}
                            >
                              <p className="text-sm">{messageText}</p>
                            </div>
                            <span className="text-[9px] text-gray-500 mt-1">
                              {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-800">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-500 hover:border-gray-600"
                      />
                      <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FaComments className="text-3xl text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
                  <p className="max-w-xs text-sm">Select a trip chat from the sidebar to start coordinating with your companions.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
