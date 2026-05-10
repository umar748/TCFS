import React, { useState, useEffect, useRef } from 'react';
import { BiBell, BiSearch } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { getUser, getToken } from '../../services/auth';

export default function TopNav({ onToggleSidebar, hideSearch = false, hideNotifications = false, hideProfile = false }) {
  const navigate = useNavigate();
  const user = getUser();
  const userAvatar = user?.profileImage || user?.profilePicture || '';
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token || ''}` }
        });
        const data = await res.json().catch(() => null);
        if (data?.notifications) {
          setNotifications(data.notifications);
          const unreadCount = data.notifications.filter(n => !n.read).length;
          setNotificationCount(unreadCount);
        }
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    };
    
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Refresh every 15s
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const token = getToken();
        
        // Search for users
        const userRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token || ''}` }
        }).then(r => r.ok ? r.json() : { users: [] }).catch(() => ({ users: [] }));
        
        const users = userRes?.users || [];
        const combined = users.slice(0, 8).map(u => ({
          type: 'user',
          id: u._id,
          name: u.name,
          location: u.location
        }));
        
        if (!cancelled) {
          setResults(combined);
          setShowResults(combined.length > 0);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setShowResults(false);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const getInitial = () => {
    if (user?.name) {
      return user.name.split(' ')[0][0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="w-full sticky top-0 z-40 backdrop-blur bg-gray-950/95 border-b border-gray-800 shadow-lg shadow-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-md hover:bg-gray-900 transition-all" onClick={onToggleSidebar} aria-label="Toggle sidebar">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-all cursor-pointer"
              aria-label="Go to dashboard"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#0a4d5c] via-[#1a7a8a] to-[#2da5bb] text-lg shadow-[0_10px_24px_rgba(26,122,138,0.28)]">
                ✈️
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Travel Companion</div>
                <div className="text-xs text-gray-400">Your travel & trips hub</div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {!hideSearch && (
            <div className="relative hidden sm:block" ref={searchBoxRef}>
              <input
                placeholder="Search destinations, travelers..."
                className="rounded-xl border border-gray-700 bg-gray-900 text-gray-200 placeholder-gray-500 pl-3 pr-10 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
              />
              <BiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              
              {showResults && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {searching && (
                    <div className="p-4 text-center text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  )}
                  {!searching && results.map((result, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (result.type === 'user') {
                          navigate(`/dashboard/matches?filter=${result.id}`);
                        }
                        setShowResults(false);
                        setQuery('');
                      }}
                      className="p-3 border-b border-gray-700 hover:bg-gray-700/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {result.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{result.name}</p>
                          <p className="text-gray-400 text-xs">{result.location || 'No location'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!searching && results.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
            
            {!hideNotifications && (
            <div className="relative" ref={notificationRef}>
              <button 
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-md hover:bg-gray-900 transition-all cursor-pointer z-10" 
                aria-label="Notifications"
              >
                <BiBell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 bg-gray-700/50 border-b border-gray-700">
                    <h3 className="text-white font-bold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div 
                          key={notif._id || idx}
                          className={`p-4 border-b border-gray-700 hover:bg-gray-700/20 transition-all cursor-pointer ${!notif.read ? 'bg-blue-500/10' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="text-white text-sm font-semibold">{notif.type || 'Notification'}</p>
                              <p className="text-gray-300 text-xs mt-1">{notif.message || 'No message'}</p>
                              {notif.createdAt && (
                                <p className="text-gray-500 text-xs mt-2">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {!hideProfile && (
            <button 
              type="button"
              onClick={() => {
                console.log('Profile clicked');
                if (user?.role === 'admin') {
                  navigate('/dashboard/admin/settings');
                } else {
                  navigate('/dashboard/edit-profile');
                }
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-all cursor-pointer z-10"
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={user.name || 'User'} 
                  className="w-8 h-8 rounded-lg object-cover border border-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                  {getInitial()}
                </div>
              )}
              <span className="text-sm text-gray-300 hidden md:block">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
            </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
