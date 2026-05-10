import React, { useState } from 'react';
import { sendBroadcast } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaBullhorn, FaPaperPlane, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function AdminAnnouncements() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('System');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus(null);
    try {
      const data = await sendBroadcast(message, type);
      if (data.success) {
        setStatus({ success: true, message: data.message });
        setMessage('');
      }
    } catch (error) {
      setStatus({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Broadcast Announcements</h1>
              <p className="text-gray-400 mt-1">Send global notifications to all registered travelers</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 uppercase mb-2">Notification Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setType('System')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        type === 'System' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-900/50 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      <FaInfoCircle className="text-xl" />
                      <span className="font-bold">System Update</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setType('Trip Update')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        type === 'Trip Update' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 bg-gray-900/50 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      <FaExclamationTriangle className="text-xl" />
                      <span className="font-bold">Travel Alert</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 uppercase mb-2">Message Content</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter the announcement message here..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 h-40 focus:outline-none focus:border-blue-500 transition-all resize-none"
                    required
                  ></textarea>
                </div>

                {status && (
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${status.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <FaInfoCircle />
                    <span className="text-sm font-medium">{status.message}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Send Announcement</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 flex gap-4">
              <FaBullhorn className="text-blue-400 text-2xl shrink-0 mt-1" />
              <div>
                <h4 className="text-blue-400 font-bold mb-1">Important Note</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Broadcasts will be sent instantly to all users. Please ensure the information is accurate before sending. System updates appear with a blue icon, while travel alerts use an amber warning icon.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
