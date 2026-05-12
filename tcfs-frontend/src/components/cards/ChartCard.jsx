import React from 'react';

export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}

// Simple Bar Chart Component
export function SimpleBarChart({ data = [], unit = 'items' }) {
  const defaultData = [
    { label: 'Jan', value: 45, color: 'bg-tcfs-500' },
    { label: 'Feb', value: 52, color: 'bg-tcfs-500' },
    { label: 'Mar', value: 48, color: 'bg-tcfs-500' },
    { label: 'Apr', value: 61, color: 'bg-tcfs-500' },
    { label: 'May', value: 55, color: 'bg-tcfs-500' },
    { label: 'Jun', value: 68, color: 'bg-teal-600' },
    { label: 'Jul', value: 72, color: 'bg-teal-600' },
    { label: 'Aug', value: 65, color: 'bg-teal-600' },
    { label: 'Sep', value: 58, color: 'bg-tcfs-500' },
    { label: 'Oct', value: 64, color: 'bg-tcfs-500' },
    { label: 'Nov', value: 71, color: 'bg-teal-600' },
    { label: 'Dec', value: 78, color: 'bg-teal-600' }
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-48">
        {chartData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-full">
              <div
                className={`${item.color} w-full rounded-t transition-all duration-300 hover:opacity-80`}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
                title={`${item.label}: ${item.value} ${unit}`}
              />
            </div>
            <span className="text-xs text-neutral-600 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-tcfs-500 rounded"></div>
          <span className="text-xs text-neutral-600">Monthly registrations ({unit})</span>
        </div>
      </div>
    </div>
  );
}

// Simple Line Chart Component
export function SimpleLineChart({ data = [] }) {
  const defaultData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 68 },
    { month: 'Jul', value: 72 },
    { month: 'Aug', value: 65 },
    { month: 'Sep', value: 58 },
    { month: 'Oct', value: 64 },
    { month: 'Nov', value: 71 },
    { month: 'Dec', value: 78 }
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Generate SVG path
  const width = 100;
  const height = 100;
  const points = chartData.map((item, index) => {
    const x = (index / (chartData.length - 1)) * width;
    const y = height - ((item.value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <div className="h-48 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-tcfs-500"
          />
          <polyline
            points={points}
            fill="url(#gradient)"
            stroke="none"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className="text-tcfs-500" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-tcfs-500" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-600">
        {chartData.map((item, index) => (
          <span key={index} className="font-medium">{item.month}</span>
        ))}
      </div>
    </div>
  );
}

