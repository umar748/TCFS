import { useEffect, useRef, useState } from 'react';
import {
  FaPaperPlane,
  FaPhoneAlt,
  FaPlus,
  FaRegSmile,
  FaSearch,
  FaVideo,
  FaEllipsisV,
  FaPaperclip,
} from 'react-icons/fa';

const chatMocks = [
  {
    _id: '1',
    participantId: '2',
    participantName: 'Sarah Jenkins',
    tripId: 'trip1',
    tripName: 'Hunza Valley Adventure',
    lastMessage: "That sounds great! When are you planning to leave?",
    lastMessageTime: new Date(Date.now() - 2 * 60000),
    unreadCount: 3,
    online: true,
  },
  {
    _id: '2',
    participantId: '3',
    participantName: 'Mike Ross',
    tripId: 'trip2',
    tripName: 'Skardu Explorer',
    lastMessage: "I'm interested in the Skardu trip!",
    lastMessageTime: new Date(Date.now() - 15 * 60000),
    unreadCount: 0,
    online: true,
  },
  {
    _id: '3',
    participantId: '4',
    participantName: 'Ali Khan',
    tripId: 'trip3',
    tripName: 'Safety Discussion',
    lastMessage: 'Thanks for the travel tips!',
    lastMessageTime: new Date(Date.now() - 60 * 60000),
    unreadCount: 0,
    online: false,
  },
  {
    _id: '4',
    participantId: '5',
    participantName: 'Fatima Zahra',
    tripId: 'trip4',
    tripName: 'City Meetup',
    lastMessage: 'See you at the meetup point!',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60000),
    unreadCount: 0,
    online: false,
  },
];

const messageMocks = {
  '1': [
    {
      _id: 'm1',
      sender: { _id: '2', name: 'Sarah Jenkins' },
      message: "Hey! I saw you're planning a trip to Hunza Valley. I'm interested in joining!",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      _id: 'm2',
      sender: { _id: 'me', name: 'You' },
      message:
        "That's great! We're planning to leave next month. Are you experienced with mountain trekking?",
      timestamp: new Date(Date.now() - 3 * 60000),
    },
    {
      _id: 'm3',
      sender: { _id: '2', name: 'Sarah Jenkins' },
      message: "Yes! I've done several treks in the Northern areas. What's the difficulty level?",
      timestamp: new Date(Date.now() - 1 * 60000),
    },
  ],
  '2': [
    {
      _id: 'm4',
      sender: { _id: '3', name: 'Mike Ross' },
      message: "I'm interested in the Skardu trip!",
      timestamp: new Date(Date.now() - 20 * 60000),
    },
  ],
  '3': [
    {
      _id: 'm5',
      sender: { _id: '4', name: 'Ali Khan' },
      message: 'Thanks for the travel tips!',
      timestamp: new Date(Date.now() - 60 * 60000),
    },
  ],
  '4': [
    {
      _id: 'm6',
      sender: { _id: '5', name: 'Fatima Zahra' },
      message: 'See you at the meetup point!',
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
    },
  ],
};

function Avatar({ name, size = 'h-12 w-12 text-xl', active = false }) {
  const initial = (name || 'A').charAt(0).toUpperCase();
  return (
    <div className="relative">
      <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-bold text-white ${size}`}>
        {initial}
      </div>
      {active ? (
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#20283d]" />
      ) : null}
    </div>
  );
}

function formatListTime(date) {
  const value = new Date(date).getTime();
  const diffMinutes = Math.floor((Date.now() - value) / 60000);
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function formatBubbleTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function normalizeChat(chat) {
  return {
    _id: chat._id,
    participantId: chat.participantId,
    participantName: chat.participantName,
    tripId: chat.tripId,
    tripName: chat.tripName,
    lastMessage: chat.lastMessage,
    lastMessageTime: chat.lastMessageTime,
    unreadCount: chat.unreadCount || 0,
    online: !!chat.online,
  };
}

export default function ChatPage() {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user.userId || 'me';

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [messagesByChat, setMessagesByChat] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatForm, setNewChatForm] = useState({ name: '', phone: '' });
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const newChatNameRef = useRef(null);
  const messagesEndRef = useRef(null);
  const quickEmojis = ['😀', '😂', '😍', '👍', '🔥', '✈️', '🏔️', '📍'];

  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoadingChats(true);
        const response = await fetch('/api/chat/direct', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data.chats)) {
          throw new Error('fallback');
        }

        const normalized = data.chats.map((chat) =>
          normalizeChat({
            _id: chat._id,
            participantId: chat.participantId,
            participantName: chat.participantName,
            tripId: chat.tripId,
            tripName: chat.tripName,
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessageTime,
            unreadCount: chat.unreadCount,
            online: false,
          })
        );

        setChats(normalized.length ? normalized : chatMocks);
        setSelectedChatId((normalized[0] || chatMocks[0])._id);
      } catch {
        setChats(chatMocks);
        setSelectedChatId(chatMocks[0]._id);
      } finally {
        setLoadingChats(false);
      }
    };

    loadChats();
  }, [token]);

  useEffect(() => {
    if (!selectedChatId) return;

    const selected = chats.find((chat) => chat._id === selectedChatId);
    if (!selected) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await fetch(`/api/chat/direct/${selected.participantId}?tripId=${selected.tripId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data.messages)) {
          throw new Error('fallback');
        }

        setMessagesByChat((prev) => ({
          ...prev,
          [selectedChatId]: data.messages,
        }));
      } catch {
        setMessagesByChat((prev) => ({
          ...prev,
          [selectedChatId]: messageMocks[selectedChatId] || [],
        }));
      } finally {
        setLoadingMessages(false);
      }
    };

    if (!messagesByChat[selectedChatId]) {
      loadMessages();
    }
  }, [selectedChatId, chats, token, messagesByChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, messagesByChat]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timer = setTimeout(() => setActionMessage(''), 2200);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  useEffect(() => {
    if (!newChatOpen) return undefined;
    const timer = setTimeout(() => newChatNameRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [newChatOpen]);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.tripName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'Unread') return chat.unreadCount > 0;
    if (activeTab === 'Groups') return false;
    return true;
  });

  const selectedChat = chats.find((chat) => chat._id === selectedChatId) || filteredChats[0] || null;
  const selectedMessages = selectedChat ? messagesByChat[selectedChat._id] || [] : [];

  const handleSend = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const outgoing = {
      _id: Date.now().toString(),
      sender: { _id: userId, name: user.name || 'You' },
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChat._id]: [...(prev[selectedChat._id] || []), outgoing],
    }));

    setChats((prev) =>
      prev.map((chat) =>
        chat._id === selectedChat._id
          ? { ...chat, lastMessage: outgoing.message, lastMessageTime: outgoing.timestamp, unreadCount: 0 }
          : chat
      )
    );

    const payload = newMessage.trim();
    setNewMessage('');

    try {
      if (token) {
        await fetch('/api/chat/direct/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: selectedChat.participantId,
            tripId: selectedChat.tripId,
            message: payload,
          }),
        });
      }
    } catch {
      // Keep optimistic local message.
    }
  };

  const handleHeaderAction = (type) => {
    setMenuOpen(false);
    if (!selectedChat) return;

    if (type === 'call') {
      setActionMessage(`Voice call with ${selectedChat.participantName} is not available yet.`);
      return;
    }

    if (type === 'video') {
      setActionMessage(`Video call with ${selectedChat.participantName} is not available yet.`);
      return;
    }

    if (type === 'profile') {
      setActionMessage(`Profile view for ${selectedChat.participantName} can be added next.`);
      return;
    }

    if (type === 'mute') {
      setActionMessage(`${selectedChat.participantName} has been muted for this demo session.`);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setActionMessage(`Attached file selected: ${file.name}`);
    event.target.value = '';
  };

  const handleEmojiInsert = (emoji) => {
    setNewMessage((prev) => `${prev}${emoji}`);
    setEmojiOpen(false);
  };

  const handleNewChat = () => {
    setNewChatForm({ name: '', phone: '' });
    setNewChatOpen(true);
    setMenuOpen(false);
    setEmojiOpen(false);
  };

  const handleCreateChat = (event) => {
    event.preventDefault();
    const name = newChatForm.name.trim();
    const phone = newChatForm.phone.trim();

    if (!name || !phone) {
      setActionMessage('Enter both contact name and phone number.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    const chatId = `new-${Date.now()}`;
    const partnerId = `contact-${phoneDigits || Date.now()}`;
    const newChat = {
      _id: chatId,
      participantId: partnerId,
      participantName: name,
      tripId: `direct-${phoneDigits || Date.now()}`,
      tripName: phone,
      lastMessage: `Chat started with ${phone}`,
      lastMessageTime: new Date(),
      unreadCount: 0,
      online: false,
    };

    const starterMessage = {
      _id: `starter-${Date.now()}`,
      sender: { _id: userId, name: user.name || 'You' },
      message: `Hi ${name}, this is my first message to ${phone}.`,
      timestamp: new Date(),
    };

    setChats((prev) => [newChat, ...prev.filter((chat) => chat.participantId !== partnerId)]);
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: [starterMessage],
    }));
    setSelectedChatId(chatId);
    setActiveTab('All');
    setSearchTerm('');
    setNewChatOpen(false);
    setNewChatForm({ name: '', phone: '' });
    setActionMessage(`New chat created with ${name}.`);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0f172c] text-white">
      {newChatOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0b1222]/70 px-4">
          <div className="w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[#20283d] p-6 shadow-[0_20px_50px_rgba(5,10,22,0.45)]">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-white">Start New Chat</h2>
              <p className="mt-2 text-sm text-slate-400">Add a contact name and phone number to open a new conversation.</p>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Contact name</label>
                <input
                  ref={newChatNameRef}
                  type="text"
                  value={newChatForm.name}
                  onChange={(event) => setNewChatForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter contact name"
                  className="w-full rounded-2xl border border-[#42506d] bg-[#11192f] px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Phone number</label>
                <input
                  type="tel"
                  value={newChatForm.phone}
                  onChange={(event) => setNewChatForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-2xl border border-[#42506d] bg-[#11192f] px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewChatOpen(false)}
                  className="rounded-2xl border border-white/10 bg-[#11192f] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        <aside className="flex w-full flex-col overflow-hidden border-b border-white/10 bg-[#20283d] lg:h-full lg:w-[375px] lg:border-b-0 lg:border-r">
          <div className="p-5">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h1 className="text-[2.3rem] font-black leading-none tracking-tight">
                Messages
                <br />
                <span className="text-blue-500">Inbox</span>
              </h1>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-500"
              >
                <FaPlus />
                New
              </button>
            </div>

            <div className="relative mb-6">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search karo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-[#42506d] bg-[#11192f] py-3 pl-12 pr-4 text-base text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex items-center gap-4">
              {['All', 'Unread', 'Groups'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-base font-semibold transition ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-[#11192f] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-scrollbar flex-1 overflow-y-auto border-t border-white/10">
            {loadingChats ? (
              <div className="p-6 text-slate-400">Loading chats...</div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => setSelectedChatId(chat._id)}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
                    selectedChat?._id === chat._id
                      ? 'border-l-2 border-l-blue-500 bg-[#11192f]'
                      : 'hover:bg-[#11192f]/70'
                  }`}
                >
                  <Avatar name={chat.participantName} active={chat.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[1.15rem] font-bold text-white">{chat.participantName}</p>
                        <p className="truncate text-base text-slate-400">{chat.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-slate-400">{formatListTime(chat.lastMessageTime)}</span>
                        {chat.unreadCount > 0 ? (
                          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-2 text-sm font-bold text-white">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#11192f]">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 bg-[#20283d] px-6 py-5">
                <div className="flex items-center gap-4">
                  <Avatar name={selectedChat.participantName} size="h-14 w-14 text-2xl" />
                  <div>
                    <h2 className="text-[1.9rem] font-extrabold leading-none text-white">
                      {selectedChat.participantName}
                    </h2>
                    <p className="mt-1 text-lg text-emerald-400">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      {selectedChat.online ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <button
                    type="button"
                    title="Voice call"
                    onClick={() => handleHeaderAction('call')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11192f] text-slate-300 transition hover:border-blue-400/50 hover:text-white"
                  >
                    <FaPhoneAlt />
                  </button>
                  <button
                    type="button"
                    title="Video call"
                    onClick={() => handleHeaderAction('video')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11192f] text-slate-300 transition hover:border-blue-400/50 hover:text-white"
                  >
                    <FaVideo />
                  </button>
                  <button
                    type="button"
                    title="More options"
                    onClick={() => setMenuOpen((value) => !value)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11192f] text-slate-300 transition hover:border-blue-400/50 hover:text-white"
                  >
                    <FaEllipsisV />
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-14 z-20 w-44 rounded-2xl border border-white/10 bg-[#20283d] p-2 shadow-[0_14px_30px_rgba(5,10,22,0.35)]">
                      <button
                        type="button"
                        onClick={() => handleHeaderAction('profile')}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-[#11192f]"
                      >
                        View profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHeaderAction('mute')}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-[#11192f]"
                      >
                        Mute chat
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {actionMessage ? (
                <div className="border-b border-white/10 bg-[#18233a] px-6 py-3 text-sm text-blue-200">
                  {actionMessage}
                </div>
              ) : null}

              <div className="chat-scrollbar flex-1 overflow-y-auto px-6 py-8">
                <div className="mx-auto mb-10 flex w-fit items-center rounded-full bg-[#20283d] px-5 py-2 text-sm font-semibold text-slate-300">
                  Today
                </div>

                {loadingMessages ? (
                  <div className="text-slate-400">Loading conversation...</div>
                ) : (
                  <div className="space-y-6">
                    {selectedMessages.map((message) => {
                      const isOwn = String(message.sender?._id) === String(userId);
                      return (
                        <div key={message._id} className={`flex items-start gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn ? (
                            <Avatar name={message.sender?.name} size="h-9 w-9 text-sm" />
                          ) : null}
                          <div className={`max-w-[min(78%,720px)] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`rounded-[1.2rem] px-5 py-4 text-[1.1rem] leading-8 ${
                                isOwn
                                  ? 'rounded-tr-[0.5rem] bg-blue-600 text-white'
                                  : 'rounded-tl-[0.5rem] bg-[#20283d] text-slate-100'
                              }`}
                            >
                              {message.message}
                            </div>
                            <div className={`mt-2 text-sm text-slate-400 ${isOwn ? 'text-right' : 'text-left'} w-full`}>
                              {formatBubbleTime(message.timestamp)}
                            </div>
                          </div>
                          {isOwn ? (
                            <Avatar name={user.name || 'A'} size="h-9 w-9 text-sm" />
                          ) : null}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-[#20283d] px-6 py-5">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentChange}
                  />
                  <button
                    type="button"
                    title="Attach file"
                    onClick={handleAttachmentClick}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11192f] text-slate-300 transition hover:border-blue-400/50 hover:text-white"
                  >
                    <FaPaperclip />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      title="Insert emoji"
                      onClick={() => setEmojiOpen((value) => !value)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11192f] text-slate-300 transition hover:border-blue-400/50 hover:text-white"
                    >
                      <FaRegSmile />
                    </button>
                    {emojiOpen ? (
                      <div className="absolute bottom-14 left-0 z-20 grid w-52 grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-[#20283d] p-3 shadow-[0_14px_30px_rgba(5,10,22,0.35)]">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiInsert(emoji)}
                            className="rounded-xl bg-[#11192f] px-2 py-2 text-xl transition hover:bg-[#18233a]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(event) => {
                      setNewMessage(event.target.value);
                      if (emojiOpen) setEmojiOpen(false);
                    }}
                    className="flex-1 rounded-2xl border border-[#42506d] bg-[#11192f] px-5 py-3 text-base text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500"
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-400">Select a chat to start messaging.</div>
          )}
        </section>
      </div>
    </div>
  );
}
