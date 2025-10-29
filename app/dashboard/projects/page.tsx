/**
 * ==============================================================================
 * Projects Management Page
 * ==============================================================================
 * Manage construction projects (jobs) with full CRUD operations
 * ==============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  job_number: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  estimated_completion_date: string;
  actual_completion_date: string | null;
  total_amount: number;
  created_at: string;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  properties: {
    id: string;
    street_address: string;
    city: string;
    state: string;
  };
}

export default function ProjectsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', 'start_date');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchJobs();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-gray-100 text-gray-800';
      case 'estimate':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lead':
        return '📋';
      case 'estimate':
        return '📝';
      case 'scheduled':
        return '📅';
      case 'in_progress':
        return '🔨';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">Manage construction projects and track progress</p>
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
            <option value="">All Projects</option>
            <option value="lead">Lead</option>
            <option value="estimate">Estimate</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {['lead', 'estimate', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => {
          const count = jobs.filter((j) => j.status === status).length;
          const totalValue = jobs
            .filter((j) => j.status === status)
            .reduce((sum, j) => sum + (j.total_amount || 0), 0);

          return (
            <div key={status} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getStatusIcon(status)}</span>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm text-gray-600 capitalize mb-1">{status.replace('_', ' ')}</p>
              {totalValue > 0 && (
                <p className="text-xs text-gray-500">${totalValue.toLocaleString()}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No projects found</p>
            <p className="text-gray-400 mt-2">
              {statusFilter ? 'Try adjusting your filters' : 'Projects will appear here when created'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.job_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.clients.first_name} {job.clients.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{job.clients.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{job.properties.street_address}</div>
                      <div className="text-sm text-gray-500">
                        {job.properties.city}, {job.properties.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)} {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.start_date ? new Date(job.start_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ${(job.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedJob.job_number}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client & Property */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Client</h3>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedJob.clients.first_name} {selectedJob.clients.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedJob.clients.email}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Property</h3>
                  <p className="text-sm text-gray-900">{selectedJob.properties.street_address}</p>
                  <p className="text-sm text-gray-600">
                    {selectedJob.properties.city}, {selectedJob.properties.state}
                  </p>
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedJob.start_date ? new Date(selectedJob.start_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Completion</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedJob.estimated_completion_date
                        ? new Date(selectedJob.estimated_completion_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${(selectedJob.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {selectedJob.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap mt-1">{selectedJob.description}</p>
                  </div>
                )}
              </div>

              {/* Update Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {['lead', 'estimate', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateJobStatus(selectedJob.id, status)}
                      disabled={updating || selectedJob.status === status}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedJob.status === status
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {getStatusIcon(status)} {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
