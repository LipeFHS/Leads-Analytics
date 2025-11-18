import React from 'react';
import { Users, Leaf, DollarSign, ArrowRightCircle } from 'lucide-react';
import { DashboardStats } from '../types';

interface KpiCardsProps {
  stats: DashboardStats;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  const calculatePercent = (val: number) => {
    if (stats.total === 0) return 0;
    return ((val / stats.total) * 100).toFixed(1);
  };

  const cards = [
    {
      title: 'Total Leads',
      value: stats.total,
      subtext: '100%',
      icon: Users,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    },
    {
      title: 'Organic Leads',
      value: stats.organic,
      subtext: `${calculatePercent(stats.organic)}%`,
      icon: Leaf,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      title: 'Paid Leads',
      value: stats.paid,
      subtext: `${calculatePercent(stats.paid)}%`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      title: 'Direct Traffic',
      value: stats.direct,
      subtext: `${calculatePercent(stats.direct)}%`,
      icon: ArrowRightCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`bg-white p-6 rounded-xl shadow-sm border ${card.border} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.bg} ${card.color}`}>
                {card.subtext}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};