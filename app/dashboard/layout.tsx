/**
 * ==============================================================================
 * Dashboard Layout
 * ==============================================================================
 * This component defines the shared layout for all pages within the
 * authenticated dashboard, including a responsive sidebar and main content area.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { logout } from '@/app/actions/auth';

const Sidebar = () => {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">
          CD Home Improvements
        </h1>
      </div>
      <nav className="mt-6 flex-1">
        <a href="/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 font-semibold bg-gray-100 border-r-4 border-blue-600">
          Dashboard
        </a>
        <a href="/dashboard/projects" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
          Projects
        </a>
        <a href="/dashboard/invoices" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
          Invoices
        </a>
        <a href="/dashboard/clients" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
          Clients
        </a>
        <a href="/dashboard/leads" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
          Leads
        </a>
      </nav>
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
    <h1 className="text-xl font-bold text-blue-600">CDHI</h1>
    <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-800">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </button>
  </header>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
