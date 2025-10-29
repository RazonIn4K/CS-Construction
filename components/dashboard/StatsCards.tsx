/**
 * ==============================================================================
 * Stats Cards Component
 * ==============================================================================
 * Displays key statistics in a set of cards.
 * ==============================================================================
 */

import React from 'react';

const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* New Leads Card */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">New Leads</h3>
            <p className="text-3xl font-bold text-blue-600">3</p>
            <p className="text-sm text-gray-500">Waiting for response</p>
        </div>
        {/* Outstanding Invoices Card */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Outstanding Invoices</h3>
            <p className="text-3xl font-bold text-red-500">$12,450</p>
            <p className="text-sm text-gray-500">Across 4 projects</p>
        </div>
        {/* Recent Payments Card */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Payments</h3>
            <p className="text-3xl font-bold text-green-500">$3,200</p>
            <p className="text-sm text-gray-500">This week</p>
        </div>
        {/* Active Projects Card */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-yellow-500">5</p>
            <p className="text-sm text-gray-500">In progress</p>
        </div>
    </div>
);

export default StatsCards;