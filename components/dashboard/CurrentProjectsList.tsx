/**
 * ==============================================================================
 * Current Projects List Component
 * ==============================================================================
 * Displays a list of current projects with their progress.
 * ==============================================================================
 */

import React from 'react';

const CurrentProjectsList = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Projects</h3>
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium text-gray-700">Miller Kitchen Remodel</span>
          <span className="text-sm text-gray-500">75%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium text-gray-700">Davis Bathroom Addition</span>
          <span className="text-sm text-gray-500">30%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium text-gray-700">Garcia Deck Construction</span>
          <span className="text-sm text-gray-500">95%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '95%' }}></div>
        </div>
      </div>
    </div>
  </div>
);

export default CurrentProjectsList;