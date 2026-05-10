import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', // 'positive' or 'negative'
  icon: Icon,
  color = 'tcfs',
  subtitle
}) {
  const colorClasses = {
    tcfs: {
      bg: 'bg-tcfs-50',
      icon: 'bg-tcfs-100 text-tcfs-600',
      value: 'text-tcfs-700',
      border: 'border-tcfs-200'
    },
    accent: {
      bg: 'bg-accent-50',
      icon: 'bg-accent-100 text-accent-600',
      value: 'text-accent-700',
      border: 'border-accent-200'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      value: 'text-blue-700',
      border: 'border-blue-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      value: 'text-purple-700',
      border: 'border-purple-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.tcfs;

  return (
    <div className={`bg-white rounded-xl shadow-card p-6 border ${colors.border} hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.value} mb-2`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-neutral-500">{subtitle}</p>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'positive' ? '↑' : '↓'} {change}
              </span>
              <span className="text-xs text-neutral-500">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${colors.icon} p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

