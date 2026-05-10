import React, { useRef } from 'react';
import { FaHome, FaUsers, FaMapMarkedAlt, FaPlane, FaComments, FaCog, FaShieldAlt, FaList, FaFlag, FaSearch, FaRobot, FaNewspaper, FaEnvelope } from 'react-icons/fa';
import clsx from 'clsx';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { getUser, logout } from '../../services/auth';

export default function Sidebar({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const userAvatar = user?.profileImage || user?.profilePicture || '';

  const getInitial = () => {
    if (user?.name) {
      return user.name.split(' ')[0][0].toUpperCase();
    }
    return 'U';
  };

  const defaultItems = isAdmin ? [
    { label: 'Overview', icon: FaHome, to: '/dashboard/admin' },
    { label: 'User Management', icon: FaUsers, to: '/dashboard/admin/users' },
    { label: 'Trip Management', icon: FaPlane, to: '/dashboard/admin/trips' },
    { label: 'Verifications', icon: FaShieldAlt, to: '/dashboard/admin/verifications' },
    { label: 'Reports', icon: FaFlag, to: '/dashboard/admin/reports' },
    { label: 'Announcements', icon: FaEnvelope, to: '/dashboard/admin/announcements' },
    { label: 'System Settings', icon: FaCog, to: '/dashboard/admin/settings' },
  ] : [
    { label: 'Dashboard', icon: FaHome, to: '/dashboard' },
    { label: 'Search', icon: FaSearch, to: '/search' },
    { label: 'Requests', icon: FaEnvelope, to: '/requests', badge: true },
    { label: 'Explore Destinations', icon: FaMapMarkedAlt, to: '/explore-destinations' },
    { label: 'Matches', icon: FaUsers, to: '/dashboard/matches' },
    { label: 'Trips', icon: FaPlane, to: '/dashboard/trips' },
    { label: 'Messages', icon: FaComments, to: '/dashboard/messages' },
    { label: 'Feed', icon: FaNewspaper, to: '/feed' },
    { label: 'AI Assistant', icon: FaRobot, to: '/ai-assistant' },
    { label: 'Settings', icon: FaCog, to: '/dashboard/settings' },
  ];

  const items = defaultItems;
  const scrollRef = useRef(null);
  const scrollBy = (delta) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: delta, behavior: 'smooth' });
  };

  return (
    <aside className={clsx(
      "w-72 bg-gray-950 backdrop-blur border-r border-gray-800 h-[calc(100vh-4rem)] z-50 transition-all duration-300",
      "fixed md:sticky top-16",
      className
    )}>
      <div className="p-6">
        {/* User Profile Section */}
        {!isAdmin && user && (
          <div 
            onClick={() => navigate('/dashboard/edit-profile')}
            className="mb-6 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={user.name || 'User'} 
                  className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                  {getInitial()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-white">{user.name || 'User'}</div>
                <div className="text-xs text-gray-400">{user.location || 'Add location'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 text-xs font-semibold text-gray-400 uppercase">{isAdmin ? 'Admin Menu' : 'MAIN MENU'}</div>
        <div className="relative">
        <nav ref={scrollRef} className="space-y-1 max-h-[48vh] overflow-y-auto pr-8">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.label}
                to={it.to}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{it.label}</span>
              </NavLink>
            );
          })}
        </nav>

        </div>

        {!isAdmin && (
          <div className="mt-8 border-t border-gray-800 pt-6">
            <div className="text-xs font-semibold text-gray-400 uppercase">TRAVEL STATS</div>
            <div className="mt-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Your Journey</div>
              <div className="flex items-center gap-8 mt-3">
                <div>
                  <div className="text-3xl font-bold text-blue-400">12</div>
                  <div className="text-xs text-gray-400">Trips</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400">8</div>
                  <div className="text-xs text-gray-400">Countries</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-800 pt-6">
          <button
            onClick={() => logout()}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-gray-300 hover:bg-red-600 hover:text-white transition-all font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
