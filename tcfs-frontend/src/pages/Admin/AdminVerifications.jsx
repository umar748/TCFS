import React, { useEffect, useState } from 'react';
import { getVerifications, handleVerification } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaShieldAlt, FaCheck, FaTimes, FaIdCard, FaUserCircle, FaExclamationCircle } from 'react-icons/fa';

export default function AdminVerifications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getVerifications();
      if (data.success) {
        setVerifications(data.verifications);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const comments = prompt(action === 'approve' ? "Optional approval notes:" : "Reason for rejection (required):");
    if (action === 'reject' && !comments) return alert("Rejection reason is required");
    if (comments === null) return;

    try {
      await handleVerification(id, action, comments);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Identity Verification</h1>
            <p className="text-gray-400 mt-1">Review ID documents and face match results for "Verified Traveler" status</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {verifications.filter(v => v.status === 'Pending').map(v => (
                <div key={v._id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-700/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        {v.user?.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-200">{v.user?.name}</h3>
                        <p className="text-xs text-gray-500">{v.user?.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded">Pending Review</span>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <FaIdCard className="text-gray-600" />
                        ID Document
                      </label>
                      <div className="aspect-video bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden group relative">
                        {v.idCardImage ? (
                          <img src={v.idCardImage} alt="ID Card" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-700 italic text-xs">No image provided</div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                           <button className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded shadow-lg">View Fullsize</button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <FaUserCircle className="text-gray-600" />
                        Verification Selfie
                      </label>
                      <div className="aspect-video bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden group relative">
                        {v.selfieImage ? (
                          <img src={v.selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-700 italic text-xs">No image provided</div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                           <button className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded shadow-lg">View Fullsize</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                        <FaShieldAlt className="text-blue-500" />
                        OCR Verification
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Name Match:</span>
                          <span className={v.ocrData?.nameMatch ? 'text-green-400 font-bold' : 'text-rose-400 font-bold'}>
                            {v.ocrData?.nameMatch ? 'Match' : 'Mismatch'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">ID Number:</span>
                          <span className="text-gray-200 font-mono">{v.ocrData?.cnicNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                        <FaShieldAlt className="text-purple-500" />
                        Face Match Score
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${v.faceMatchScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${v.faceMatchScore}%` }}
                          />
                        </div>
                        <span className={`text-lg font-black ${v.faceMatchScore > 80 ? 'text-green-400' : 'text-amber-400'}`}>
                          {v.faceMatchScore}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-2">AI confidence level for biometric match</p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-700/10 border-t border-gray-700 flex gap-3">
                    <button 
                      onClick={() => handleAction(v._id, 'reject')}
                      className="flex-1 py-3 rounded-xl border border-rose-500/50 text-rose-500 font-bold text-sm hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <FaTimes /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(v._id, 'approve')}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <FaCheck /> Approve
                    </button>
                  </div>
                </div>
              ))}
              
              {verifications.filter(v => v.status === 'Pending').length === 0 && (
                <div className="col-span-2 py-20 text-center bg-gray-800/50 rounded-2xl border border-dashed border-gray-700">
                  <FaShieldAlt className="text-gray-700 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-500">All caught up!</h3>
                  <p className="text-gray-600 text-sm mt-1">No traveler identity verifications are currently pending review.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
