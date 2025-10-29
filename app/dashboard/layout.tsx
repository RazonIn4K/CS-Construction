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

const Sidebar = () => (
    <aside className="w-64 bg-white shadow-md flex-shrink-0">
        <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-600">
                CD Home Improvements
            </h1>
        </div>
        <nav className="mt-6">
            <a href="/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 font-semibold bg-gray-100 border-r-4 border-blue-600">
                Dashboard
            </a>
            <a href="#" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
                Projects
            </a>
            <a href="#" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
                Invoices
            </a>
            <a href="#" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
                Clients
            </a>
        </nav>
    </aside>
);

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
                    <div className="absolute left-0 top-0 h-full">
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