import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDestinationDetail } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { 
  FaMapMarkerAlt, FaUser, FaCalendarAlt, FaArrowLeft, 
  FaCheckCircle, FaPlane, FaUsers, FaInfoCircle 
} from 'react-icons/fa';

export default function AdminDestinationDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [name]);

  const loadData = async () => {
    if (!name || name === 'undefined') return;
    setLoading(true);
    try {
      console.log("Fetching details for:", name);
      const res = await getDestinationDetail(name);
      console.log("Received data:", res);
      if (res.success) {
        setData(res);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white animate-fade-in flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10 animate-slide-up">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <FaArrowLeft />
            </button>
            <div>
              <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-1">
                <FaMapMarkerAlt />
                Destination Intelligence
              </div>
              <h1 className="text-4xl font-black">{name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {data?.trips?.map((trip, idx) => (
              <div 
                key={trip._id} 
                className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden animate-slide-up hover:border-gray-600 transition-all shadow-xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Trip Banner Section */}
                <div className="p-8 border-b border-gray-700 bg-gray-700/20">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    {/* Left: Trip Summary */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {trip.status}
                        </span>
                        <span className="text-gray-500 text-xs font-bold">Created {new Date(trip.created_at).toLocaleDateString()}</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-4">Trip to {trip.destination}</h2>
                      <p className="text-gray-400 leading-relaxed italic border-l-4 border-emerald-500/30 pl-4 mb-6">
                        "{trip.description}"
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-900 rounded-lg text-gray-400"><FaCalendarAlt /></div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Dates</p>
                            <p className="text-sm font-semibold">{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-900 rounded-lg text-gray-400"><FaPlane /></div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Budget</p>
                            <p className="text-sm font-semibold">${trip.budget}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-900 rounded-lg text-gray-400"><FaUsers /></div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Team Size</p>
                            <p className="text-sm font-semibold">{trip.participants?.length + 1} Travelers</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Creator Profile */}
                    <div className="lg:w-80 bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FaUser className="text-emerald-500" /> Trip Organizer
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-lg shadow-lg">
                          {trip.creator_id?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white">{trip.creator_id?.name}</h4>
                            {trip.creator_id?.verificationStatus === 'Verified' && <FaCheckCircle className="text-blue-400 text-xs" />}
                          </div>
                          <p className="text-xs text-gray-500">{trip.creator_id?.email}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-4">{trip.creator_id?.bio || 'No bio provided'}</p>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold">
                        <FaMapMarkerAlt className="text-gray-700" /> {trip.creator_id?.location || 'Unknown Location'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="p-8 bg-gray-800">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FaUsers className="text-blue-400" /> Joined Travelers ({trip.participants?.length})
                  </h3>
                  {trip.participants?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trip.participants.map(p => (
                        <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">
                            {p.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-bold text-gray-200">{p.name}</p>
                              {p.verificationStatus === 'Verified' && <FaCheckCircle className="text-blue-400 text-[10px]" />}
                            </div>
                            <p className="text-[10px] text-gray-500">{p.location || 'Explorer'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600 italic text-sm">
                      <FaInfoCircle /> No participants have joined this trip yet.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(!data?.trips || data.trips.length === 0) && (
              <div className="py-20 text-center bg-gray-800/50 rounded-2xl border border-dashed border-gray-700">
                <FaPlane className="text-gray-700 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500">No active trips found</h3>
                <p className="text-gray-600 text-sm mt-1">There are currently no scheduled trips for this destination.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
