/**
 * ==============================================================================
 * Contractor Dashboard Page
 * ==============================================================================
 * This is the main dashboard for the contractor, showing an overview of
 * projects, invoices, and leads with real-time data from Supabase.
 * ==============================================================================
 */

'use client';

import React, { useEffect, useState } from 'react';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import QuickActions from '@/components/dashboard/QuickActions';
import StatsCards from '@/components/dashboard/StatsCards';
import CurrentProjectsList from '@/components/dashboard/CurrentProjectsList';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  paymentStatus: string;
  statusText: string;
}

const OutstandingInvoicesList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/dashboard/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-500';
      case 'due_today':
        return 'text-orange-500';
      case 'due_soon':
        return 'text-yellow-600';
      default:
        return 'text-green-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
        <p className="text-gray-500 text-center py-8">All invoices are paid!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">{invoice.clientName}</p>
              <p className={`text-sm ${getStatusColor(invoice.paymentStatus)}`}>
                {invoice.statusText}
              </p>
            </div>
            <p className="font-semibold text-gray-900">
              ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div>
      <WelcomeHeader />
      <QuickActions />
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CurrentProjectsList />
        </div>
        <OutstandingInvoicesList />
      </div>
    </div>
  );
}
