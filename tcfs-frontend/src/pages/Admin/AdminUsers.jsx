import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUsers, manageUser } from '../../services/admin';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { 
  FaUsers, FaSearch, FaFilter, FaEllipsisV, FaUserShield, 
  FaUserSlash, FaTrash, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt 
} from 'react-icons/fa';

export default function AdminUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const currentFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('filter') || 'all';
  }, [location.search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading users with filter:', currentFilter);
      const data = await getUsers({ search, status: currentFilter });
      console.log('Users data received:', data);
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, currentFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleFilterChange = (newFilter) => {
    navigate(`/dashboard/admin/users?filter=${newFilter}`);
  };

  const handleAction = async (userId, action) => {
    const confirmMsg = action === 'delete' 
      ? "Permanently delete this user? This cannot be undone." 
      : `Are you sure you want to ${action} this user?`;
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await manageUser(userId, action);
      loadUsers();
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-gray-400 mt-1">Manage, moderate and verify platform members</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, city..." 
                    className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 w-64 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
               <select 
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                value={currentFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
               >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="blocked">Blocked Only</option>
               </select>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-t-2xl">
                <strong>Error:</strong> {error}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-700/30 border-b border-gray-700">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Verification</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-700/20 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-gray-200">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FaMapMarkerAlt className="text-gray-600" />
                            {user.location || 'Not Specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            user.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              {user.verificationStatus === 'Verified' ? (
                                <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-md">
                                  <FaCheckCircle className="text-[10px]" />
                                  Verified
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs font-bold bg-gray-700/50 px-2 py-1 rounded-md">
                                  {user.verificationStatus || 'Unverified'}
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {user.isBlocked ? (
                              <button 
                                onClick={() => handleAction(user._id, 'unblock')}
                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                title="Unblock User"
                              >
                                <FaCheckCircle />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAction(user._id, 'block')}
                                className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                                title="Block User"
                              >
                                <FaUserSlash />
                              </button>
                            )}
                            <button 
                              onClick={() => handleAction(user._id, 'delete')}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              title="Delete User"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="py-20 text-center text-gray-500 italic">
                    No users found matching your criteria
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
