import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken, getUser } from '../../services/auth';
import { FaArrowLeft, FaBell, FaShieldAlt, FaGlobe, FaLock, FaUser, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function Settings() {
  const navigate = useNavigate();
  const user = getUser();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    privacyProfile: true,
    allowMessages: true,
    twoFactorAuth: false,
    darkMode: true
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      removeToken();
      navigate('/login');
    }
  };

  const settingsGroups = [
    {
      title: 'Notifications',
      icon: <FaBell className="text-blue-400" />,
      items: [
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant alerts on your device' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: <FaShieldAlt className="text-green-400" />,
      items: [
        { key: 'privacyProfile', label: 'Public Profile', desc: 'Allow others to see your profile' },
        { key: 'allowMessages', label: 'Allow Messages', desc: 'Let verified users message you' },
        { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Extra security for your account' }
      ]
    },
    {
      title: 'Appearance',
      icon: <FaGlobe className="text-purple-400" />,
      items: [
        { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme throughout the app' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-semibold"
        >
          <FaArrowLeft /> Back
        </button>

        <h1 className="text-4xl font-extrabold mb-2">
          <span className="text-blue-500">Settings & </span>
          <span className="text-green-400">Preferences</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">Manage your account settings and preferences</p>

        {/* Account Summary */}
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaUser className="text-blue-400" />
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-white font-semibold">{user?.email || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="text-white font-semibold capitalize">{user?.role || 'User'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Verification Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                user?.verificationStatus === 'Verified' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {user?.verificationStatus || 'Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6 mb-8">
          {settingsGroups.map((group, idx) => (
            <div key={idx} className="bg-gray-950 p-6 rounded-xl border border-gray-800">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                {group.icon}
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-300">
                    <div>
                      <p className="text-white font-semibold">{item.label}</p>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className="text-2xl transition-all duration-300 hover:scale-110"
                    >
                      {settings[item.key] ? (
                        <FaToggleOn className="text-green-400" />
                      ) : (
                        <FaToggleOff className="text-gray-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/dashboard/edit-profile')}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
          >
            Edit Profile Information
          </button>
          <button 
            onClick={() => navigate('/dashboard/safety')}
            className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-bold rounded-xl text-sm px-5 py-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50"
          >
            View Safety Guidelines
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-800 font-bold rounded-xl text-sm px-5 py-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
          >
            Logout
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-950 p-6 rounded-xl border border-blue-500/30 text-blue-200 text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><FaShieldAlt /> Privacy Note:</p>
          <p>Your data is encrypted and secure. We never share your personal information with third parties without your consent. All changes are saved automatically.</p>
        </div>
      </div>
    </div>
  );
}
