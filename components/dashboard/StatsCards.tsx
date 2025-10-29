/**
 * ==============================================================================
 * Stats Cards Component
 * ==============================================================================
 * Displays key metrics in card format on the dashboard
 * ==============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

interface Stats {
  activeProjects: number;
  outstandingAmount: number;
  newLeads: number;
  totalClients: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    activeProjects: 0,
    outstandingAmount: 0,
    newLeads: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Active Projects</h3>
        <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Outstanding Invoices</h3>
        <p className="text-3xl font-bold text-gray-900">
          ${stats.outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">New Leads (30d)</h3>
        <p className="text-3xl font-bold text-gray-900">{stats.newLeads}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Clients</h3>
        <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
      </div>
    </div>
  );
}
