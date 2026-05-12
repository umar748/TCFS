import React, { useState, useEffect } from 'react';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import ProfileCard from '../../components/cards/ProfileCard';
import ActivityCard from '../../components/cards/ActivityCard';
import { getToken, getUser } from '../../services/auth';
import { socket } from '../../socket';
import {
  FaUsers,
  FaPlane,
  FaPlus,
  FaPaperPlane
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '';

const inferTripImage = (destination = '') => {
  const lower = String(destination).toLowerCase();
  if (lower.includes('lahore')) return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80';
  if (lower.includes('skardu')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
  if (lower.includes('hunza')) return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80';
  if (lower.includes('islamabad')) return 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80';
  if (lower.includes('karachi')) return 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80';
  return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80';
};

const resolveTripImage = (image, destination) => {
  const src = String(image || '').trim();
  if (!src) return inferTripImage(destination);
  if (src.startsWith('data:image/')) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${API_URL}${src}`;
  return inferTripImage(destination);
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trips, setTrips] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [message, setMessage] = useState('');
  const user = getUser();

  const fetchDiscoverTrips = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/trips/discover', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setTrips(data.items);
      }
    } catch (e) {
      console.error("Error fetching trips", e);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/requests/incoming', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setIncomingRequests(data.requests);
      }
    } catch (e) {
      console.error("Error fetching requests", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDiscoverTrips(), fetchIncomingRequests()]);
      setLoading(false);
    };
    init();

    const handleTripCreated = () => {
      fetchDiscoverTrips();
    };

    socket.on('tripCreated', handleTripCreated);

    socket.on('requestSent', (data) => {
      setIncomingRequests(prev => [data.request, ...prev]);
      // Optional: show a notification toast here
    });

    socket.on('requestAccepted', (data) => {
      alert(`Your request for ${data.trip_title} was accepted! You can now chat.`);
    });

    socket.on('requestRejected', (data) => {
      alert(`Your request for ${data.trip_title} was declined.`);
    });

    return () => {
      socket.off('tripCreated', handleTripCreated);
      socket.off('requestSent');
      socket.off('requestAccepted');
      socket.off('requestRejected');
    };
  }, []);

  const handleJoinRequest = async (tripId) => {
    if (!message.trim()) return alert('Please enter a message');
    try {
      setRequesting(tripId);
      const token = getToken();
      const res = await fetch('/api/requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ trip_id: tripId, message })
      });
      const data = await res.json();
      if (data.success) {
        alert('Request sent successfully!');
        setMessage('');
        setRequesting(null);
      } else {
        alert(data.message || 'Failed to send request');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setRequesting(null);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/requests/${requestId}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setIncomingRequests(prev => prev.filter(req => req._id !== requestId));
        alert(`Request ${action} successfully!`);
      } else {
        alert(data.message || 'Failed to update request');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <TopNav onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar className={!sidebarOpen ? 'hidden' : ''} />

        <main className="flex-1 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold">
                  <span className="text-blue-500">Discover </span>
                  <span className="text-green-400">Trips</span>
                </h1>
                <p className="text-gray-400 mt-2">
                  Find your next travel companion and join exciting journeys
                </p>
              </div>
              <button 
                className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-3.5 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
                onClick={() => window.location.href='/dashboard/trips/create'}
              >
                <FaPlus className="w-4 h-4" />
                New Trip
              </button>
            </div>
          </div>

          {/* Trips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {loading ? (
              <div className="col-span-2 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading trips...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-gray-950 rounded-xl border border-gray-800 p-8">
                <FaPlane className="text-4xl text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No trips found. Be the first to plan one!</p>
              </div>
            ) : (
              trips.map(trip => {
                const tripId = trip.id || trip._id;
                const imageSrc = resolveTripImage(trip.image, trip.destination);
                const start = new Date(trip.start_date);
                const end = new Date(trip.end_date);
                const durationDays = Math.max(1, Math.ceil((end - start) / 86400000));

                return (
                  <div key={tripId} className="group overflow-hidden rounded-[2rem] bg-[#111827] shadow-[0_28px_60px_-25px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={imageSrc}
                        alt={`${trip.destination} trip`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = inferTripImage(trip.destination);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                      <div className="absolute right-5 top-5 rounded-2xl bg-emerald-500/95 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20">
                        ${trip.budget}
                      </div>

                      <div className="absolute left-5 bottom-5 right-5 rounded-[2rem] border border-white/10 bg-black/30 p-5 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Discover Trip</p>
                        <h3 className="mt-2 text-3xl font-semibold text-white">{trip.destination}</h3>
                        <p className="mt-2 text-sm text-slate-300 line-clamp-2">{trip.description}</p>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-300 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                          {durationDays} days
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {trip.interests?.slice(0, 5).map((interest, i) => (
                          <span key={i} className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                            {interest}
                          </span>
                        ))}
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={trip.creator_id?.profilePicture || 'https://via.placeholder.com/40'}
                            alt={trip.creator_id?.name}
                            className="h-10 w-10 rounded-full border border-sky-400 object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-white">{trip.creator_id?.name || 'Unknown User'}</p>
                            <p className="text-xs text-slate-400">Trip Creator</p>
                          </div>
                        </div>
                      </div>

                      {requesting === tripId ? (
                        <div className="space-y-3">
                          <textarea
                            className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3.5 text-sm text-gray-200 placeholder-gray-500 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="Say hi and why you want to join..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            autoFocus
                            rows="3"
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50"
                              onClick={() => handleJoinRequest(tripId)}
                              disabled={requesting === tripId}
                            >
                              <span className="inline-flex items-center justify-center gap-2"><FaPaperPlane className="w-3 h-3" /> Send Request</span>
                            </button>
                            <button
                              className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-200 transition-all duration-300 hover:bg-gray-700"
                              onClick={() => setRequesting(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50"
                          onClick={() => setRequesting(tripId)}
                        >
                          Request to Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <aside className="w-80 hidden xl:block py-8 space-y-6">
          <ProfileCard 
            name={user?.name || "User"} 
            role={user?.role === "admin" ? "Administrator" : "Traveler"} 
            badge={user?.verificationStatus === "verified" ? "Verified" : "Member"} 
            organization="TCFS" 
          />

          {/* Incoming Requests Section */}
          <div className="bg-gray-950 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FaUsers className="text-blue-400" />
                Join Requests
              </h3>
              {incomingRequests.length > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
              {incomingRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">No pending requests</p>
                </div>
              ) : (
                incomingRequests.map(req => (
                  <div key={req._id} className="p-4 hover:bg-gray-900 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <img 
                        src={req.from_user_id?.profilePicture || 'https://via.placeholder.com/32'} 
                        alt={req.from_user_id?.name} 
                        className="w-8 h-8 rounded-full border border-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{req.from_user_id?.name}</p>
                        <p className="text-xs text-gray-500 truncate">wants to join: {req.trip_id?.destination}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-3 italic border border-gray-700">
                      "{req.message}"
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRequestAction(req._id, 'accepted')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRequestAction(req._id, 'rejected')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <ActivityCard activities={[]} />
        </aside>
      </div>
    </div>
  );
}
