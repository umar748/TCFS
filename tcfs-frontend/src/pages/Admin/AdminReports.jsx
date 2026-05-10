import React, { useEffect, useState } from 'react';
import { getReports, updateReport } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaFlag, FaUser, FaCheck, FaExclamationTriangle, FaHistory, FaSearch } from 'react-icons/fa';

export default function AdminReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getReports();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    const action = prompt("Describe the action taken (e.g., 'User warned', 'Account blocked'):");
    if (action === null) return;
    try {
      await updateReport(id, 'Resolved', action);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredReports = reports.filter(r => r.status === filter);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Safety & Abuse Reports</h1>
              <p className="text-gray-400 mt-1">Moderate user complaints and handle platform violations</p>
            </div>
            
            <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
              <button 
                onClick={() => setFilter('Pending')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'Pending' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter('Resolved')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'Resolved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map(r => (
                <div key={r._id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all">
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${r.status === 'Pending' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {r.status}
                        </span>
                        <h3 className="text-lg font-bold text-gray-200">{r.subject}</h3>
                      </div>
                      
                      <p className="text-gray-400 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-xl border border-gray-700 italic">
                        "{r.description}"
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <FaUser className="text-xs" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Reporter</p>
                            <p className="font-semibold text-gray-300">{r.createdBy?.name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <FaExclamationTriangle className="text-xs" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Target User</p>
                            <p className="font-semibold text-rose-400">{r.targetUser?.name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64 flex flex-col justify-center border-l border-gray-700 md:pl-6 space-y-4">
                      {r.status === 'Resolved' ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                          <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                            <FaHistory /> Action Taken
                          </p>
                          <p className="text-xs text-gray-400 italic">"{r.adminAction || 'No action recorded'}"</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUpdate(r._id)}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FaCheck /> Resolve Report
                        </button>
                      )}
                      <div className="text-[10px] text-gray-600 font-bold uppercase text-center">
                        Filed on {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="py-20 text-center bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                   <FaFlag className="text-gray-700 text-4xl mx-auto mb-3" />
                   <p className="text-gray-500 font-medium">No {filter.toLowerCase()} reports found.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
