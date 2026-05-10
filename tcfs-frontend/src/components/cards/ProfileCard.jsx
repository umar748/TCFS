import React from 'react';

export default function ProfileCard({ 
  name = 'Umar', 
  role = 'Sustainability Officer', 
  badge = 'Verified',
  organization = 'EcoTex Inc'
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-card flex items-center gap-4 max-w-md">
      <div className="w-14 h-14 rounded-md bg-gradient-to-br from-tcfs-400 to-tcfs-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
        {name.split(' ').map(n => n.charAt(0)).join('')}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">
          {name} 
          <span className="text-xs bg-tcfs-100 text-tcfs-700 px-2 py-0.5 rounded ml-2 font-medium">{badge}</span>
        </div>
        <div className="text-xs text-neutral-500">{role} • {organization}</div>
        <div className="mt-2 text-xs text-neutral-600">Member since 2024 • 12 products tracked</div>
      </div>
    </div>
  );
}