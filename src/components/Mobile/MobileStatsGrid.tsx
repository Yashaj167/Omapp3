import React from 'react';

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

interface MobileStatsGridProps {
  stats: StatItem[];
}

export function MobileStatsGrid({ stats }: MobileStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {stat.change && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-600 leading-tight">{stat.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}