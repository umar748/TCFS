import React, { useEffect, useState } from 'react';
import { getDestinations } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaMapMarkerAlt, FaPlane, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function AdminDestinations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const data = await getDestinations();
      if (data.success) {
        setDestinations(data.destinations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDestinations = destinations.filter(d => 
    d.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-900 text-white animate-fade-in flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
          <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
          <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center gap-4 mb-8 animate-slide-up">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Trip Hotspots</h1>
              <p className="text-gray-400 mt-1">Full breakdown of most traveled destinations on the platform</p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 animate-slide-up delay-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3 text-emerald-400">
                <FaMapMarkerAlt />
                All Destinations
              </h3>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input 
                  type="text" 
                  placeholder="Search destinations..." 
                  className="bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDestinations.map((dest, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/dashboard/admin/destinations/${encodeURIComponent(dest.destination)}`)}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 hover:bg-gray-900 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm">
                        #{idx + 1}
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {dest.count} {dest.count === 1 ? 'Active Trip' : 'Active Trips'}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{dest.destination}</h4>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-all duration-700" 
                        style={{ width: `${destinations.length > 0 ? (dest.count / destinations[0].count) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDestinations.length === 0 && (
              <div className="py-20 text-center text-gray-500 italic">
                No destinations found matching your search.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
