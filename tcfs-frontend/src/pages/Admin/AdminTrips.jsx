import React, { useEffect, useState } from 'react';
import { getTrips, updateTrip, deleteTrip } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaPlane, FaEdit, FaTrash, FaUsers, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function AdminTrips() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading trips...');
      const data = await getTrips();
      console.log('Trips data received:', data);
      if (data.success) {
        setTrips(data.trips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setError(error.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trip? This action cannot be undone.")) return;
    try {
      await deleteTrip(id);
      loadTrips();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredTrips = trips.filter(t => 
    t.destination.toLowerCase().includes(search.toLowerCase()) ||
    t.creator_id?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Trip Management</h1>
              <p className="text-gray-400 mt-1">Monitor and moderate user-created trips</p>
            </div>
            <input 
              type="text" 
              placeholder="Search by destination or creator..." 
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-80 focus:outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg m-6">
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredTrips.map(trip => (
                <div key={trip._id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                        <FaMapMarkerAlt />
                        <span>{trip.destination}</span>
                      </div>
                      <h3 className="text-xl font-bold">{trip.creator_id?.name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-400">{trip.creator_id?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(trip._id)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        title="Delete Trip"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-6 line-clamp-2">{trip.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
                      <FaCalendarAlt className="text-gray-500" />
                      <div>
                        <div className="text-[10px] uppercase text-gray-500 font-bold">Duration</div>
                        <div className="text-xs">
                          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
                      <FaUsers className="text-gray-500" />
                      <div>
                        <div className="text-[10px] uppercase text-gray-500 font-bold">Participants</div>
                        <div className="text-xs">{trip.participants?.length || 0} Joined</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {trip.interests?.map(interest => (
                      <span key={interest} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-[10px] uppercase font-bold tracking-wider">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
