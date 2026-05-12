import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import ChartCard, { SimpleBarChart } from '../../components/cards/ChartCard';
import { 
  FaUsers, FaPlane, FaFlag, FaUserSlash, FaChartLine, FaMapMarkerAlt,
  FaArrowUp, FaArrowDown, FaCalendarCheck
} from 'react-icons/fa';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalReports: 0,
    totalTrips: 0,
    blockedUsers: 0,
    monthlyRegistrations: [],
    popularDestinations: [],
    trends: {
      users: { value: 0, direction: 'up' },
      trips: { value: 0, direction: 'up' },
      reports: { value: 0, direction: 'down' }
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const registrationTotal = stats.monthlyRegistrations.reduce((sum, item) => sum + item.count, 0);
  const registrationAvg = stats.monthlyRegistrations.length > 0 ? Math.round(registrationTotal / stats.monthlyRegistrations.length) : 0;

  const StatCard = ({ title, value, icon: Icon, color, trend, link }) => {
    const colorMap = {
      blue: 'shadow-blue-500/10',
      emerald: 'shadow-emerald-500/10',
      rose: 'shadow-rose-500/10',
      amber: 'shadow-amber-500/10'
    };

    return (
      <div 
        onClick={() => link && navigate(link)}
        className={`bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-${color}-500/50 hover:shadow-2xl ${colorMap[color] || ''} transition-all duration-300 ease-out hover:-translate-y-1 group cursor-pointer`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="text-2xl" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend.direction === 'up' ? <FaArrowUp /> : <FaArrowDown />}
              {trend.value}%
            </div>
          )}
        </div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-white group-hover:text-blue-50 transition-colors">{value.toLocaleString()}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white animate-fade-in flex flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className={sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold">Admin Command Center</h1>
            <p className="text-gray-400 mt-1">Real-time platform overview and key performance metrics</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-slide-up delay-100">
            <StatCard 
              title="Total Travelers" 
              value={stats.totalUsers} 
              icon={FaUsers} 
              color="blue" 
              trend={stats.trends?.users} 
              link="/dashboard/admin/users"
            />
            <StatCard 
              title="Active Trips" 
              value={stats.totalTrips} 
              icon={FaPlane} 
              color="emerald" 
              trend={stats.trends?.trips} 
              link="/dashboard/admin/trips"
            />
            <StatCard 
              title="Reports Filed" 
              value={stats.totalReports} 
              icon={FaFlag} 
              color="rose" 
              trend={stats.trends?.reports} 
              link="/dashboard/admin/reports"
            />
            <StatCard 
              title="Blocked Users" 
              value={stats.blockedUsers} 
              icon={FaUserSlash} 
              color="amber" 
              link="/dashboard/admin/users?filter=blocked"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Monthly Registrations Chart */}
            <div className="xl:col-span-2 animate-slide-up delay-200">
              <ChartCard title="Growth Trajectory" subtitle="Last 6 months of traveler registrations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-gray-300">
                  <div className="rounded-3xl border border-gray-800 bg-gray-950/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total Signups</p>
                    <p className="text-2xl font-bold text-white mt-2">{registrationTotal}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-800 bg-gray-950/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Average / month</p>
                    <p className="text-2xl font-bold text-white mt-2">{registrationAvg}</p>
                  </div>
                </div>
                {stats.monthlyRegistrations.length > 0 ? (
                  <SimpleBarChart
                    data={stats.monthlyRegistrations.map(m => ({
                      label: m.name,
                      value: m.count,
                      color: 'bg-blue-500'
                    }))}
                    unit="signups"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm italic">
                    Insufficient registration data available from the database.
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Popular Destinations */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 animate-slide-up delay-300 hover:border-gray-600 transition-colors group">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
                <FaMapMarkerAlt className="text-emerald-400 group-hover:scale-110 transition-transform" />
                Hotspots
              </h3>
              <div className="space-y-6">
                {stats.popularDestinations.length > 0 ? (
                  stats.popularDestinations.map((dest, idx) => (
                    <div key={idx} className="flex items-center justify-between group/item cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 group-hover/item:text-emerald-400 group-hover/item:bg-emerald-500/10 transition-all">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover/item:text-white transition-colors">{dest.destination}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{dest.count} Active Trips</p>
                        </div>
                      </div>
                      <div className="w-12 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 group-hover/item:bg-emerald-400 transition-all duration-500" 
                          style={{ width: `${(dest.count / stats.popularDestinations[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-500 text-sm italic">
                    No destination data available
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/dashboard/admin/destinations')}
                className="w-full mt-10 py-3 rounded-xl bg-gray-900 text-xs font-bold text-gray-400 hover:text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all border border-gray-700 hover:border-emerald-500 transform active:scale-95"
              >
                View All Destinations
              </button>
            </div>
          </div>

          {/* Quick Actions / Alerts */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up delay-400">
             <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex items-start gap-5 hover:bg-amber-500/10 transition-all group hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:animate-pulse transition-all">
                  <FaCalendarCheck className="text-xl" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-400 mb-1">Action Required</h4>
                  <p className="text-sm text-gray-400 mb-4">You have {stats.pendingVerifications} identity verification requests waiting for review.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/admin/verifications')}
                    className="px-6 py-2.5 bg-amber-500 text-gray-900 text-xs font-black rounded-lg hover:bg-amber-400 transition-all transform active:scale-95 shadow-lg shadow-amber-500/20 uppercase tracking-widest"
                  >
                    Review Requests
                  </button>
                </div>
             </div>
             <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 flex items-start gap-5 hover:bg-rose-500/10 transition-all group hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 group-hover:animate-pulse transition-all">
                  <FaFlag className="text-xl" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-rose-400 mb-1">Safety Alert</h4>
                  <p className="text-sm text-gray-400 mb-4">{stats.totalReports} unresolved safety reports require your immediate attention.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/admin/reports')}
                    className="px-6 py-2.5 bg-rose-500 text-white text-xs font-black rounded-lg hover:bg-rose-400 transition-all transform active:scale-95 shadow-lg shadow-rose-500/20 uppercase tracking-widest"
                  >
                    Moderate Reports
                  </button>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
