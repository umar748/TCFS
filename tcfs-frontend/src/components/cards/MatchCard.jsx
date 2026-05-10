import React from 'react';

export default function ProductCard({ 
  name = 'Cotton T-Shirt', 
  brand = 'EcoWear', 
  emissions = 2.4,
  certification = 'GOTS',
  tags = ['organic', 'sustainable'] 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 w-full max-w-sm">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-tcfs-100 to-tcfs-200 rounded-lg flex items-center justify-center text-2xl font-bold text-tcfs-700">
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs text-neutral-500">{brand}</div>
            </div>
            <div className="text-sm font-bold text-accent-500">{emissions} kg CO₂</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-tcfs-100 text-tcfs-700 rounded-md font-medium">{certification}</span>
            {tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md">{t}</span>)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button className="btn-primary w-full">View Details</button>
        <button className="btn-ghost w-full">Compare</button>
      </div>
    </div>
  );
}