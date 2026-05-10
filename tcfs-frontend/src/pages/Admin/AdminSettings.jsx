import React, { useEffect, useState } from 'react';
import { getAIConfig, updateAIConfig } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { FaCog, FaRobot, FaSave, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await getAIConfig();
      if (data.success) {
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    setMessage(null);
    try {
      const data = await updateAIConfig(key, value);
      if (data.success) {
        setMessage({ success: true, text: `Updated ${key} successfully` });
        loadConfigs();
      }
    } catch (error) {
      setMessage({ success: false, text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Helper to find config value
  const getConfig = (key) => configs.find(c => c.key === key)?.value || '';

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
              <p className="text-gray-400 mt-1">Configure global parameters and AI assistant behavior</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* AI Assistant Configuration */}
                <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                  <div className="px-8 py-4 bg-gray-700/30 border-b border-gray-700 flex items-center gap-3">
                    <FaRobot className="text-blue-400" />
                    <h3 className="font-bold text-gray-200">AI Assistant Guidelines</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 uppercase mb-3">System Prompt</label>
                      <textarea 
                        defaultValue={getConfig('ai_system_prompt')}
                        onBlur={(e) => handleUpdate('ai_system_prompt', e.target.value)}
                        placeholder="Define how the AI should behave..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 h-40 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <FaInfoCircle />
                        This prompt controls the persona and restrictions of the AI Travel Buddy.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Platform Safety Settings */}
                <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                  <div className="px-8 py-4 bg-gray-700/30 border-b border-gray-700 flex items-center gap-3">
                    <FaShieldAlt className="text-green-400" />
                    <h3 className="font-bold text-gray-200">Safety & Moderation</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <div>
                        <h4 className="font-bold text-gray-200">Mandatory ID Verification</h4>
                        <p className="text-xs text-gray-500">Require users to verify ID before creating trips</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={getConfig('require_verification') === 'true'}
                          onChange={(e) => handleUpdate('require_verification', e.target.checked ? 'true' : 'false')}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <div>
                        <h4 className="font-bold text-gray-200">Auto-Moderation Sensitivity</h4>
                        <p className="text-xs text-gray-500">Threshold for flagging inappropriate content (1-10)</p>
                      </div>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={getConfig('mod_sensitivity') || 5}
                        onBlur={(e) => handleUpdate('mod_sensitivity', e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 w-20 text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </section>

                {/* Status Message */}
                {message && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <FaInfoCircle />
                    <span className="text-sm font-medium">{message.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
