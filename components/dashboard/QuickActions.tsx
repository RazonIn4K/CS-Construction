/**
 * ==============================================================================
 * Quick Actions Component
 * ==============================================================================
 * Provides main action buttons for the dashboard.
 * ==============================================================================
 */

import React from 'react';

const QuickActions = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <button className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Add New Project</button>
    <button className="px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">Create Invoice</button>
    <button className="px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">Add Client</button>
  </div>
);

export default QuickActions;