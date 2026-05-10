import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { getToken, getUser } from '../../services/auth';
import { FaBell, FaCheck, FaTrash, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { io } from 'socket.io-client';
import clsx from 'clsx';

export default function Notifications() {
  const navigate = useNavigate();
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'accepted', 'rejected'

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/notifications', { 
        headers: { Authorization: `Bearer ${token || ''}` } 
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setUnreadCount((data.items || []).filter(n => !n.read).length);
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (e) {
      setError('Network error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Initialize Socket.io for real-time updates
    if (user?.id || user?.userId) {
      const newSocket = io('//', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('Notification socket connected');
        newSocket.emit('join', user.id || user.userId);
      });

      // Listen for new notifications
      newSocket.on('newNotification', (notification) => {
        console.log('New notification received:', notification);
        setItems(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('TCFS', {
            body: notification.message,
            icon: '/tcfs-icon.png'
          });
        }
      });

      // Listen for notification updates
      newSocket.on('notificationUpdated', (updatedNotification) => {
        setItems(prev =>
          prev.map(n =>
            n._id === updatedNotification._id
              ? updatedNotification
              : n
          )
        );
        setUnreadCount(prev =>
          updatedNotification.read ? Math.max(0, prev - 1) : prev
        );
      });

      newSocket.on('disconnect', () => {
        console.log('Notification socket disconnected');
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user?.id, user?.userId]);

  const markAsRead = async (id) => {
    setItems(prev => prev.map(x => x._id === id ? { ...x, read: true } : x));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (socket) {
      socket.emit('markNotificationRead', { notificationId: id });
    }
  };

  const deleteNotification = async (id) => {
    // Assuming there's a delete endpoint, if not we just filter locally for demo
    setItems(prev => prev.filter(x => x._id !== id));
    
    // Emit via socket
    if (socket) {
      socket.emit('deleteNotification', { notificationId: id });
    }
  };

  const requestAction = async (id, action) => {
    try {
      const token = getToken();
      const endpoint = `/api/notifications/${id}/accept`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev =>
          prev.map(n =>
            n._id === id
              ? { ...n, status: action, actioned: true }
              : n
          )
        );

        if (action === 'accept' && data.partner?.id) {
          navigate(`/dashboard/messages?conversationId=${data.conversationId || data.threadId || ''}&partnerId=${data.partner.id}`);
        }
      }
    } catch (e) {
      console.error(`Error ${action} request:`, e);
    }
  };

  const openRelatedTrip = async (notification) => {
    if (!notification?.tripId) return;
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    navigate(`/search?type=trips&tripId=${encodeURIComponent(notification.tripId)}`);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'unread') return !item.read;
    if (filter === 'accepted') return item.status === 'accepted';
    if (filter === 'rejected') return item.status === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar className={!sidebarOpen ? 'hidden' : ''} />

        <main className="flex-1 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FaBell className="text-blue-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Stay updated with your trip requests and activities
                </p>
              </div>
              {items.length > 0 && (
                <button 
                  onClick={() => setItems([])}
                  className="text-sm text-gray-400 hover:text-white font-semibold transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'unread', 'accepted', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-400">
                {error}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                <FaBell className="text-gray-600 text-5xl mx-auto mb-4" />
                <p className="text-gray-400 font-medium">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredItems.map(n => (
                  <div 
                    key={n._id} 
                    className={clsx(
                      "p-6 flex items-start gap-4 transition-colors hover:bg-gray-700/50",
                      !n.read && "bg-blue-900/20 border-l-4 border-blue-500"
                    )}
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg",
                      n.type === 'Trip Request' ? "bg-blue-900/50 text-blue-400" :
                      n.type === 'Match Found' ? "bg-green-900/50 text-green-400" :
                      "bg-gray-700 text-gray-400"
                    )}>
                      {n.type === 'Trip Request' ? '✈️' :
                       n.type === 'Match Found' ? '👥' :
                       '📢'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          {n.type}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-2">
                          {new Date(n.createdAt).toLocaleString()}
                          {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                        </span>
                      </div>
                      <p className={clsx(
                        "text-sm text-gray-100 mb-3",
                        !n.read ? "font-semibold" : "font-normal"
                      )}>
                        {n.message}
                      </p>
                      
                      <div className="flex gap-3 flex-wrap">
                        {!n.read && (
                          <button 
                            onClick={() => markAsRead(n._id)}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                          >
                            <FaCheck className="text-sm" />
                            Mark as read
                          </button>
                        )}
                        {n.tripId && (
                          <button
                            onClick={() => openRelatedTrip(n)}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition bg-cyan-900/20 px-3 py-1 rounded"
                          >
                            <FaExternalLinkAlt className="text-sm" />
                            Open Trip
                          </button>
                        )}
                        {(n.type === 'Trip Request' || n.type === 'Match Request') && !n.actioned && (
                          <>
                            <button 
                              onClick={() => requestAction(n._id, 'accept')}
                              className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1 transition bg-green-900/20 px-3 py-1 rounded"
                            >
                              <FaCheckCircle className="text-sm" />
                              Accept
                            </button>
                            {n.type === 'Trip Request' ? (
                              <button 
                                onClick={() => requestAction(n._id, 'reject')}
                                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition bg-red-900/20 px-3 py-1 rounded"
                              >
                                <FaTimesCircle className="text-sm" />
                                Reject
                              </button>
                            ) : null}
                          </>
                        )}
                        {n.type === 'Trip Request' && !n.tripId && (
                          <button 
                            onClick={() => navigate('/dashboard/trips')}
                            className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition"
                          >
                            <FaExternalLinkAlt className="text-sm" />
                            View Trip
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(n._id)}
                          className="text-xs font-bold text-gray-500 hover:text-red-400 flex items-center gap-1 transition"
                        >
                          <FaTrash className="text-sm" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
