import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Lead, LeadType, DashboardStats } from '../types';

interface ChartsSectionProps {
  leads: Lead[];
  stats: DashboardStats;
}

const COLORS = {
  [LeadType.ORGANIC]: '#059669', // emerald-600
  [LeadType.PAID]: '#2563eb',    // blue-600
  [LeadType.DIRECT]: '#9333ea',  // purple-600
  [LeadType.REFERRAL]: '#64748b' // slate-500
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ leads, stats }) => {
  // Prepare Pie Data
  const pieData = [
    { name: LeadType.ORGANIC, value: stats.organic },
    { name: LeadType.PAID, value: stats.paid },
    { name: LeadType.DIRECT, value: stats.direct },
    { name: LeadType.REFERRAL, value: stats.referral },
  ].filter(d => d.value > 0);

  // Prepare Bar Data (Top 5 Paid Campaigns)
  const paidLeads = leads.filter(l => l.type === LeadType.PAID);
  const campaignCounts: Record<string, number> = {};
  
  paidLeads.forEach(l => {
    const camp = l.campaign && l.campaign !== '-' ? l.campaign : 'Unknown Campaign';
    campaignCounts[camp] = (campaignCounts[camp] || 0) + 1;
  });

  const barData = Object.entries(campaignCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Channel Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as LeadType]} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Paid Campaigns</h3>
        {barData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{fontSize: 12}} 
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0,12)}...` : value}
                />
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400">
            <p>No paid campaign data available</p>
          </div>
        )}
      </div>
    </div>
  );
};