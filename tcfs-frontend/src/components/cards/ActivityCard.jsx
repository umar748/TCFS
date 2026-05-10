import React from 'react';
import { FaLeaf, FaChartLine, FaBox, FaCheckCircle } from 'react-icons/fa';

const activityIcons = {
  product: FaBox,
  tracking: FaLeaf,
  analytics: FaChartLine,
  completed: FaCheckCircle
};

export default function ActivityCard({ activities = [] }) {
  const defaultActivities = [
    { type: 'product', title: 'New product added', description: 'Cotton T-Shirt from EcoWear', time: '2 hours ago', color: 'tcfs' },
    { type: 'tracking', title: 'Carbon footprint calculated', description: 'Linen Shirt - 1.8 kg CO₂', time: '5 hours ago', color: 'accent' },
    { type: 'analytics', title: 'Monthly report generated', description: 'December 2024 summary', time: '1 day ago', color: 'blue' },
    { type: 'completed', title: 'Certification verified', description: 'GOTS certification for 3 products', time: '2 days ago', color: 'purple' }
  ];

  const items = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800">Recent Activity</h3>
        <button className="text-sm text-tcfs-600 hover:text-tcfs-700 font-medium">View All</button>
      </div>
      <div className="space-y-4">
        {items.map((activity, index) => {
          const Icon = activityIcons[activity.type] || FaLeaf;
          const colorClasses = {
            tcfs: 'bg-tcfs-100 text-tcfs-600',
            accent: 'bg-accent-100 text-accent-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600'
          };
          const iconColor = colorClasses[activity.color] || colorClasses.tcfs;

          return (
            <div key={index} className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
              <div className={`${iconColor} p-2.5 rounded-lg flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">{activity.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{activity.description}</p>
                <p className="text-xs text-neutral-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

