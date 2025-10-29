/**
 * ==============================================================================
 * Current Projects List Component
 * ==============================================================================
 * Displays a list of active projects on the dashboard
 * ==============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  job_number: string;
  title: string;
  status: string;
  start_date: string;
  estimated_completion_date: string;
  total_amount: number;
  clients: {
    first_name: string;
    last_name: string;
  };
  properties: {
    street_address: string;
  };
}

export default function CurrentProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/dashboard/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Projects</h3>
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

  if (projects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Projects</h3>
        <p className="text-gray-500 text-center py-8">No active projects at the moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Projects</h3>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border-b border-gray-200 pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{project.title}</h4>
                <p className="text-sm text-gray-600">
                  {project.clients.first_name} {project.clients.last_name} - {project.properties.street_address}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
              <span className="font-semibold text-gray-900">
                ${project.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
