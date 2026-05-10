import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getToken } from '../../services/auth';
import { socket } from '../../socket';
import { FaArrowLeft, FaPlus, FaCalendarAlt, FaDollarSign, FaMapMarkerAlt, FaUsers, FaEdit } from 'react-icons/fa';

export default function Trips() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cardRefs = useRef({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/trips/mine', {
          headers: { Authorization: `Bearer ${token || ''}` }
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(data?.message || `Failed (${res.status})`);
          return;
        }
        setTrips(data.trips || []);
      } catch (e) {
        setError(e?.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();

    socket.on('tripCreated', (newTrip) => {
      // If the current user is the creator, they already have it or it will refresh
    });

    return () => {
      socket.off('tripCreated');
    };
  }, []);

  useEffect(() => {
    if (!loading && !error && trips.length > 0) {
      const params = new URLSearchParams(location.search);
      const focusId = params.get('focusTrip');
      if (focusId && cardRefs.current[focusId]) {
        cardRefs.current[focusId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, error, trips, location.search]);

  const activeTrips = trips.filter((trip) => {
    const endDate = new Date(trip.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today && trip.status !== 'completed';
  });

  const completedTrips = trips.filter((trip) => {
    const endDate = new Date(trip.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today || trip.status === 'completed';
  });

  const renderTripCard = (t) => {
    const params = new URLSearchParams(location.search);
    const focusId = params.get('focusTrip');
    const isFocus = focusId === t._id;
    const isCompleted = completedTrips.some((trip) => trip._id === t._id);

    return (
      <div
        key={t._id}
        ref={(el) => { if (el) cardRefs.current[t._id] = el; }}
        className={`bg-gray-950 rounded-xl border overflow-hidden shadow-2xl hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group ${
          isFocus ? 'border-blue-500 ring-2 ring-blue-400' : 'border-gray-800 hover:border-blue-500/50'
        }`}
      >
        <div className={`p-6 text-white ${isCompleted ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-blue-600 to-green-600'}`}>
          <h3 className="text-2xl font-bold">{t.destination}</h3>
          <p className="text-sm text-gray-100 mt-1 flex items-center gap-1">
            <FaCalendarAlt className="w-3 h-3" />
            {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FaDollarSign className="text-green-400 text-lg" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-lg font-bold text-white">${t.budget}</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm line-clamp-2">{t.description}</p>

          {t.interests && t.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {t.interests.slice(0, 3).map((interest, i) => (
                <span key={i} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                  {interest}
                </span>
              ))}
              {t.interests.length > 3 && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  +{t.interests.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaUsers className="text-gray-500" />
              <span className="text-sm text-gray-400">{t.participants?.length || 1} Participants</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isCompleted
                ? 'bg-gray-500/20 text-gray-300'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {isCompleted ? 'completed' : (t.status || 'upcoming')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/dashboard/trips/create?tripId=${t._id}`)}
              className="w-full text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg text-sm px-4 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/40 inline-flex items-center justify-center gap-2"
            >
              <FaEdit /> Edit
            </button>
            <button className="w-full text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm px-4 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50">
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-semibold"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold">
              <span className="text-blue-500">My </span>
              <span className="text-green-400">Trips</span>
            </h1>
            <p className="text-gray-400 text-lg mt-2">Manage and view all your planned adventures</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/trips/create')}
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-6 py-3.5 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
          >
            <FaPlus /> Plan New Trip
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your trips...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-4 text-center font-medium mb-8">
            {error}
          </div>
        )}

        {!loading && !error && (
          trips.length === 0 ? (
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-12 text-center">
              <FaMapMarkerAlt className="text-4xl text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Trips Yet</h3>
              <p className="text-gray-400 mb-6">You haven't planned any trips yet. Start your adventure now!</p>
              <button 
                onClick={() => navigate('/dashboard/trips/create')}
                className="text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-sm px-6 py-2.5 transition-all duration-300 inline-flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/50"
              >
                <FaPlus /> Create Your First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">My Current Trips</h2>
                    <p className="text-sm text-gray-400 mt-1">Trips that are active, upcoming, or still visible to travelers.</p>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-300">
                    {activeTrips.length} Active
                  </span>
                </div>
                {activeTrips.length === 0 ? (
                  <div className="rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-400">
                    No active trips right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTrips.map(renderTripCard)}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Completed Trips</h2>
                    <p className="text-sm text-gray-400 mt-1">Trips whose end date has passed. These remain saved for your record.</p>
                  </div>
                  <span className="rounded-full bg-gray-500/15 px-3 py-1 text-sm font-semibold text-gray-300">
                    {completedTrips.length} Completed
                  </span>
                </div>
                {completedTrips.length === 0 ? (
                  <div className="rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-400">
                    No completed trips yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTrips.map(renderTripCard)}
                  </div>
                )}
              </section>
            </div>
          )
        )}
      </div>
    </div>
  );
}
