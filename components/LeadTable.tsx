import React, { useState } from 'react';
import { Lead, LeadType } from '../types';
import { Filter } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  const [filter, setFilter] = useState<LeadType | 'ALL'>('ALL');

  const filteredLeads = filter === 'ALL' 
    ? leads 
    : leads.filter(l => l.type === filter);

  const getBadgeStyle = (type: LeadType) => {
    switch (type) {
      case LeadType.ORGANIC: return 'bg-emerald-100 text-emerald-800';
      case LeadType.PAID: return 'bg-blue-100 text-blue-800';
      case LeadType.DIRECT: return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Lead Details</h3>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center mr-2 text-slate-400">
            <Filter size={16} />
            <span className="ml-1 text-sm">Filter:</span>
          </div>
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter(LeadType.ORGANIC)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === LeadType.ORGANIC ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Organic
          </button>
          <button 
            onClick={() => setFilter(LeadType.PAID)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === LeadType.PAID ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Paid
          </button>
          <button 
            onClick={() => setFilter(LeadType.DIRECT)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === LeadType.DIRECT ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Direct
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
            <tr>
              <th className="px-6 py-4">Name / Email</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Source / Medium</th>
              <th className="px-6 py-4">Campaign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-400">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle(lead.type)}`}>
                      {lead.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{lead.source !== '-' ? lead.source : <span className="italic text-slate-300">Empty</span>}</span>
                      <span className="text-xs text-slate-400">{lead.medium}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                     {lead.campaign}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No leads found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center">
        <span>Showing {filteredLeads.length} results</span>
      </div>
    </div>
  );
};