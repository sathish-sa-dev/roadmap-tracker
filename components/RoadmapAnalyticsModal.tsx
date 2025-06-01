import React from 'react';
import Modal from './Modal.tsx';
import { Roadmap, CalculatedTaskStats } from '../types.ts';

interface RoadmapAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap | null;
  stats: CalculatedTaskStats | null;
}

const StatCard: React.FC<{ title: string; value: number; percentage?: number; colorClass: string }> = 
  ({ title, value, percentage, colorClass }) => (
  <div className={`p-4 rounded-lg shadow-md ${colorClass}`}>
    <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    <p className="text-3xl font-semibold text-gray-900">{value}</p>
    {percentage !== undefined && <p className="text-xs text-gray-600">{percentage}% of total</p>}
  </div>
);

const RoadmapAnalyticsModal: React.FC<RoadmapAnalyticsModalProps> = ({ isOpen, onClose, roadmap, stats }) => {
  if (!isOpen || !roadmap || !stats) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Analytics for: ${roadmap.name}`}>
      <div className="space-y-6 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Tasks" value={stats.totalTasks} colorClass="bg-blue-100 border border-blue-200" />
          <StatCard 
            title="Tasks Completed" 
            value={stats.completedTasks} 
            percentage={stats.completedPercentage} 
            colorClass="bg-green-100 border border-green-200" 
          />
          <StatCard 
            title="Tasks In Progress" 
            value={stats.inProgressTasks} 
            percentage={stats.inProgressPercentage} 
            colorClass="bg-yellow-100 border border-yellow-200" 
          />
          <StatCard 
            title="Tasks Overdue" 
            value={stats.overdueTasks} 
            percentage={stats.overduePercentage} 
            colorClass="bg-red-100 border border-red-200" 
          />
        </div>

        {stats.totalTasks > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2">Task Status Overview:</h4>
            <div className="space-y-2">
              {(stats.completedTasks > 0 || stats.totalTasks === 0) && (
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>Completed</span>
                    <span>{stats.completedTasks} ({stats.completedPercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full" 
                      style={{ width: `${stats.completedPercentage}%` }}
                      title={`Completed: ${stats.completedPercentage}%`}
                    ></div>
                  </div>
                </div>
              )}
              {(stats.inProgressTasks > 0 || stats.totalTasks === 0) && (
                <div>
                   <div className="flex justify-between text-xs mb-0.5">
                    <span>In Progress</span>
                    <span>{stats.inProgressTasks} ({stats.inProgressPercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-yellow-500 h-4 rounded-full" 
                      style={{ width: `${stats.inProgressPercentage}%` }}
                      title={`In Progress: ${stats.inProgressPercentage}%`}
                    ></div>
                  </div>
                </div>
              )}
              {(stats.overdueTasks > 0 || stats.totalTasks === 0) && (
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>Overdue</span>
                    <span>{stats.overdueTasks} ({stats.overduePercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-red-500 h-4 rounded-full" 
                      style={{ width: `${stats.overduePercentage}%` }}
                      title={`Overdue: ${stats.overduePercentage}%`}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
         {stats.totalTasks === 0 && (
            <p className="text-center text-gray-500 py-4">No tasks in this roadmap to analyze.</p>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoadmapAnalyticsModal;