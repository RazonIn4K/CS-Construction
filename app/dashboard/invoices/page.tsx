/**
 * ==============================================================================
 * Invoices Page
 * ==============================================================================
 * View and track invoices (managed by Invoice Ninja)
 * ==============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  status: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  jobs?: {
    id: string;
    job_number: string;
    title: string;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', 'due_date');
      params.append('sortOrder', 'asc');

      const response = await fetch(`/api/invoices?${params}`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatus = (invoice: Invoice) => {
    if (invoice.balance_due <= 0) return { text: 'Paid', color: 'text-green-600' };

    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return { text: `Overdue by ${Math.abs(daysUntilDue)} days`, color: 'text-red-600' };
    } else if (daysUntilDue === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (daysUntilDue <= 7) {
      return { text: `Due in ${daysUntilDue} days`, color: 'text-yellow-600' };
    } else {
      return { text: `Due ${dueDate.toLocaleDateString()}`, color: 'text-gray-600' };
    }
  };

  // Calculate statistics
  const stats = {
    total: invoices.length,
    outstanding: invoices.filter((i) => i.balance_due > 0).length,
    overdue: invoices.filter((i) => {
      const dueDate = new Date(i.due_date);
      return i.balance_due > 0 && dueDate < new Date();
    }).length,
    paid: invoices.filter((i) => i.balance_due <= 0).length,
    totalOutstanding: invoices.reduce((sum, i) => sum + i.balance_due, 0),
    totalPaid: invoices.reduce((sum, i) => sum + i.amount_paid, 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">Track and manage invoices</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Outstanding</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.outstanding}</p>
          <p className="text-sm text-gray-500 mt-1">
            ${stats.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.paid}</p>
          <p className="text-sm text-gray-500 mt-1">
            ${stats.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No invoices found</p>
            <p className="text-gray-400 mt-2">
              {statusFilter ? 'Try adjusting your filters' : 'Invoices from Invoice Ninja will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const paymentStatus = getPaymentStatus(invoice);
                  return (
                    <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.clients.first_name} {invoice.clients.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.clients.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.jobs ? (
                          <div>
                            <div className="text-sm text-gray-900">{invoice.jobs.title}</div>
                            <div className="text-sm text-gray-500">{invoice.jobs.job_number}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        ${invoice.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        ${invoice.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${paymentStatus.color}`}>
                          {paymentStatus.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
