/**
 * ==============================================================================
 * Contractor Dashboard Page
 * ==============================================================================
 * This is the main dashboard for the contractor, showing an overview of
 * projects, invoices, and leads.
 * ==============================================================================
 */

import React from 'react';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import QuickActions from '@/components/dashboard/QuickActions';
import StatsCards from '@/components/dashboard/StatsCards';
import CurrentProjectsList from '@/components/dashboard/CurrentProjectsList';

const OutstandingInvoicesList = () => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
        {/* Placeholder for invoice items */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium text-gray-800">Jane Miller</p>
                    <p className="text-sm text-red-500">Overdue by 2 days</p>
                </div>
                <p className="font-semibold text-gray-900">$2,500</p>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium text-gray-800">Robert Davis</p>
                    <p className="text-sm text-yellow-600">Due in 5 days</p>
                </div>
                <p className="font-semibold text-gray-900">$4,000</p>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium text-gray-800">Maria Garcia</p>
                    <p className="text-sm text-green-500">Paid Today</p>
                </div>
                <p className="font-semibold text-gray-900">$1,200</p>
            </div>
        </div>
    </div>
);


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