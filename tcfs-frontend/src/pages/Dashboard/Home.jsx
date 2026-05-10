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
              trips.map(trip => (
                <div key={trip.id || trip._id} className="bg-gray-950 p-6 rounded-xl shadow-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{trip.destination}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-bold text-lg">${trip.budget}</span>
                      <p className="text-xs text-gray-500">Budget</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{trip.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trip.interests?.map((interest, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        {interest}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <img 
                      src={trip.creator_id?.profilePicture || 'https://via.placeholder.com/40'} 
                      alt={trip.creator_id?.name} 
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{trip.creator_id?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">Trip Creator</p>
                    </div>
                  </div>

                  {requesting === (trip.id || trip._id) ? (
                    <div className="space-y-3">
                      <textarea 
                        className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3.5 placeholder-gray-500 transition-all"
                        placeholder="Say hi and why you want to join..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        autoFocus
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-2.5 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/50"
                        onClick={() => handleJoinRequest(trip.id || trip._id)}
                          disabled={requesting === trip._id}
                        >
                          <FaPaperPlane className="w-3 h-3" />
                          Send Request
                        </button>
                        <button 
                          className="flex-1 text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 font-bold rounded-xl text-sm px-5 py-2.5 transition-all duration-300"
                          onClick={() => setRequesting(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
                      onClick={() => setRequesting(trip._id)}
                    >
                      Request to Join
                    </button>
                  )}
                </div>
              ))
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
