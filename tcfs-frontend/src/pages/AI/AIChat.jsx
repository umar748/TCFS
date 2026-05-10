import { useEffect, useRef, useState } from 'react';
import { FaLightbulb, FaMap, FaPaperPlane, FaRobot, FaShieldAlt, FaUsers } from 'react-icons/fa';

const quickSuggestions = [
  { icon: '🙂', label: 'Find travel companions', prompt: 'Help me find travel companions.' },
  { icon: '🚀', label: 'Recommend trips near me', prompt: 'Recommend trips near me.' },
  { icon: '🛡️', label: 'Safety tips for travelers', prompt: 'Give me safety tips for travelers.' },
  { icon: '?', label: 'About TCFS', prompt: 'Tell me about TCFS.' },
  { icon: '📍', label: 'Best destinations in Pakistan', prompt: 'What are the best destinations in Pakistan?' },
  { icon: '💡', label: 'Travel planning tips', prompt: 'Give me travel planning tips.' },
];

const capabilityCards = [
  {
    title: 'Find Companions',
    description: 'Get matched with compatible travel partners',
    icon: FaUsers,
  },
  {
    title: 'Trip Planning',
    description: 'Get personalized travel recommendations',
    icon: FaMap,
  },
  {
    title: 'Safety Tips',
    description: 'Learn how to stay safe while traveling',
    icon: FaShieldAlt,
  },
  {
    title: 'TCFS Info',
    description: 'Learn about the Travel Companion Finder System',
    icon: FaLightbulb,
  },
];

const supportBadges = ['Smart Matching', '150+ Countries', 'Verified Users', 'Instant Responses'];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your Travel Companion AI Assistant. I can help you find travel buddies, provide safety tips, answer questions about TCFS, and give travel recommendations. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setLoading(true);

    try {
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage.text,
          userId: user.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'ai',
            text: data.response || 'I apologize, but I encountered an error. Please try again.',
          },
        ]);
        setIsTyping(false);
      }, 550);
    } catch {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'ai',
            text: "I'm currently running in offline mode. I can still help with basic travel safety and TCFS guidance. What would you like to know?",
          },
        ]);
        setIsTyping(false);
      }, 550);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (prompt) => {
    setInputValue(prompt);
  };

  const showIntroSections = messages.length <= 1;

  return (
    <div className="min-h-screen overflow-hidden bg-[#0f172c] text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[-8%] top-[72%] h-72 w-72 rounded-full bg-cyan-500/18 blur-3xl" />
          <div className="absolute right-[-6%] top-[54%] h-80 w-80 rounded-full bg-fuchsia-500/18 blur-3xl" />
          <div className="absolute left-[42%] top-[8%] h-3 w-3 animate-pulse rounded-full bg-blue-400/50" />
          <div className="absolute left-[64%] top-[16%] h-2 w-2 animate-pulse rounded-full bg-cyan-300/50" />
          <div className="absolute left-[56%] top-[22%] h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-300/40" />
        </div>

        <div className="relative z-10">
          <section className="mx-auto mb-12 max-w-4xl text-center">
            <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-violet-500 shadow-[0_24px_60px_rgba(79,70,229,0.35)] transition duration-500 hover:-translate-y-1 hover:scale-105">
              <FaRobot className="text-5xl text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-[#b9d5ff] sm:text-7xl">
              Travel AI Assistant
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl leading-10 text-slate-400">
              Get personalized travel recommendations, find companions, and stay safe
            </p>
          </section>

          <section className="mb-10 rounded-[2rem] border border-white/10 bg-[#1c263b] p-8 shadow-[0_24px_60px_rgba(5,10,22,0.26)] transition duration-300 hover:border-blue-400/20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-500 shadow-lg">
                <FaRobot className="text-xl text-white" />
              </div>
              <div className="flex-1">
                <div className="mb-4 text-2xl font-bold text-white">AI Assistant</div>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[1.4rem] border px-5 py-4 text-lg leading-9 transition duration-300 ${
                        message.sender === 'user'
                          ? 'ml-auto max-w-3xl border-blue-400/20 bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)]'
                          : 'max-w-4xl border-white/8 bg-[#11192f] text-slate-100'
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}

                  {isTyping ? (
                    <div className="max-w-xs rounded-[1.4rem] border border-white/8 bg-[#11192f] px-5 py-4 text-slate-300">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-500" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-500 [animation-delay:120ms]" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-500 [animation-delay:240ms]" />
                        </div>
                        <span className="text-sm">AI is typing...</span>
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </section>

          {showIntroSections ? (
            <>
              <section className="mb-12">
                <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                  Quick Suggestions
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {quickSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => handleSuggestion(suggestion.prompt)}
                      className="group relative min-h-[4.55rem] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#1d273d] px-8 py-5 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/35 hover:bg-[#212d45] hover:shadow-[0_18px_30px_rgba(37,99,235,0.12)]"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_45%)] opacity-0 transition duration-500 group-hover:opacity-100"
                      />
                      <div className="flex items-center gap-4">
                        <span className="relative z-10 text-[2rem] leading-none transition duration-300 group-hover:scale-110">
                          {suggestion.icon}
                        </span>
                        <span className="relative z-10 text-[1.02rem] font-semibold text-white">{suggestion.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="relative mb-10">
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_bottom_left,rgba(8,145,178,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_30%)]" />
                <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                  What I Can Help With
                </h2>
                <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {capabilityCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="group relative min-h-[13.4rem] overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#1c263b]/95 p-7 transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-[#212d45] hover:shadow-[0_18px_34px_rgba(79,70,229,0.14)]"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(8,145,178,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_38%)] opacity-100" />
                        <div className="relative z-10 mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d3b72] text-2xl text-white transition duration-300 group-hover:scale-105 group-hover:bg-[#3650a3]">
                          <Icon />
                        </div>
                        <h3 className="relative z-10 text-[1.15rem] font-bold text-white transition duration-300 group-hover:text-[#d7e6ff]">
                          {card.title}
                        </h3>
                        <p className="relative z-10 mt-4 max-w-[15rem] text-[0.95rem] leading-8 text-slate-400 transition duration-300 group-hover:text-slate-300">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}

          <section className="rounded-[2rem] bg-gradient-to-r from-[#114659] via-[#2a2d5b] to-[#5a2d7f] p-[1px] shadow-[0_24px_60px_rgba(48,33,87,0.22)]">
            <div className="rounded-[calc(2rem-1px)] bg-[#182238] p-6">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-4 lg:flex-row">
                <input
                  type="text"
                  placeholder="Ask me about travel, companions, safety, or the platform..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  disabled={loading}
                  className="flex-1 rounded-[1.3rem] border border-white/10 bg-[#1f2a43] px-6 py-5 text-lg text-white placeholder:text-slate-400 outline-none transition duration-300 focus:border-cyan-400/40 focus:bg-[#212f4c] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="inline-flex items-center justify-center gap-3 rounded-[1.25rem] bg-gradient-to-r from-blue-600 to-violet-500 px-8 py-5 text-lg font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaPaperPlane />
                  Send
                </button>
              </form>

              <div className="mt-10 border-t border-white/10 pt-8 text-center">
                <p className="mb-5 text-lg text-slate-400">
                  Powered by AI • Supports English & Urdu • Always prioritizes your safety
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {supportBadges.map((badge, index) => (
                    <span
                      key={badge}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                        index === 0
                          ? 'bg-cyan-500/10 text-cyan-200'
                          : index === 1
                            ? 'bg-blue-500/10 text-blue-200'
                            : index === 2
                              ? 'bg-violet-500/10 text-violet-200'
                              : 'bg-fuchsia-500/10 text-fuchsia-200'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
