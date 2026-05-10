import React from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../../components/layout/TopNav";
import Sidebar from "../../components/layout/Sidebar";
import StatCard from "../../components/cards/StatCard";
import { FaUsers, FaMapMarkedAlt, FaPlane, FaComments, FaShieldAlt, FaTools } from "react-icons/fa";

export default function Admin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav onToggleSidebar={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar />
        <main className="flex-1 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                <p className="text-sm text-neutral-500 mt-1">Manage users, trips, and platform settings</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/dashboard/admin/settings')} className="btn btn-secondary flex items-center gap-2">
                  <FaTools className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Users" value="1289" change="+24" changeType="positive" icon={FaUsers} color="tcfs" subtitle="new signups this month" />
            <StatCard title="Active Trips" value="42" change="+5" changeType="positive" icon={FaPlane} color="accent" subtitle="currently scheduled" />
            <StatCard title="Destinations" value="186" change="+7" changeType="positive" icon={FaMapMarkedAlt} color="blue" subtitle="listed in catalog" />
            <StatCard title="Messages Today" value="2.1k" change="+8%" changeType="positive" icon={FaComments} color="purple" subtitle="platform-wide" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <section className="bg-white p-6 rounded-xl shadow-card lg:col-span-2">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Signups</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border">
                  <div className="font-semibold">Ali Khan</div>
                  <div className="text-xs text-neutral-500">ali@travel.com • user</div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="font-semibold">Sara Malik</div>
                  <div className="text-xs text-neutral-500">sara@travel.com • user</div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="font-semibold">Admin Demo</div>
                  <div className="text-xs text-neutral-500">admin@tcfs.com • admin</div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Moderation</h3>
                <div className="space-y-3">
                  <button onClick={() => navigate('/dashboard/admin/reports')} className="btn btn-primary w-full flex items-center justify-center gap-2">
                    <FaShieldAlt className="w-4 h-4" />
                    Review Reports
                  </button>
                  <button onClick={() => navigate('/dashboard/admin/users')} className="btn btn-secondary w-full flex items-center justify-center gap-2">
                    <FaUsers className="w-4 h-4" />
                    Manage Users
                  </button>
                  <button onClick={() => navigate('/dashboard/admin/destinations')} className="btn btn-secondary w-full flex items-center justify-center gap-2">
                    <FaMapMarkedAlt className="w-4 h-4" />
                    Manage Destinations
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
