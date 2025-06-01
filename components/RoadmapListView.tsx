import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Roadmap, Task, TimeScale, CalculatedTaskStats } from '../types.ts'; 
import PlusCircleIcon from './icons/PlusCircleIcon.tsx'; 
import TrashIcon from './icons/TrashIcon.tsx';
import PencilIcon from './icons/PencilIcon.tsx';
import ChartBarIcon from './icons/ChartBarIcon.tsx';
// Removed: import ImportDataModalComponent from './ImportDataModal.tsx';
import { calculateRoadmapTaskStats } from '../services/analyticsUtils.ts';
import CogIcon from './icons/CogIcon.tsx';

interface RoadmapListViewProps {
  roadmaps: Roadmap[];
  onSelectRoadmap: (roadmapId: string) => void;
  onOpenCreateRoadmapModal: () => void; 
  onRenameRoadmap: (roadmapId: string, newName: string) => void;
  onDeleteRoadmap: (roadmapId: string) => void;
  // Removed: onImportFullRoadmap: (roadmapData: Roadmap) => void; 
  onViewRoadmapStats: (roadmapId: string) => void;
  setGlobalError: (message: string | null) => void;
  onOpenSettings: () => void;
}

const ROADMAPS_PER_PAGE = 5;

const RoadmapListView: React.FC<RoadmapListViewProps> = ({
  roadmaps,
  onSelectRoadmap,
  onOpenCreateRoadmapModal, 
  onRenameRoadmap,
  onDeleteRoadmap,
  // Removed: onImportFullRoadmap,
  onViewRoadmapStats,
  setGlobalError,
  onOpenSettings,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  // Removed: const importFullRoadmapRef = useRef<HTMLInputElement>(null);
  // Removed: const [isImportRoadmapModalOpen, setIsImportRoadmapModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const roadmapStats = useMemo(() => {
    const statsMap = new Map<string, CalculatedTaskStats>();
    roadmaps.forEach(roadmap => {
      statsMap.set(roadmap.id, calculateRoadmapTaskStats(roadmap));
    });
    return statsMap;
  }, [roadmaps]);

  const totalPages = Math.max(1, Math.ceil(roadmaps.length / ROADMAPS_PER_PAGE)); 

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(roadmaps.length / ROADMAPS_PER_PAGE));
    let newCurrentPage = currentPage;

    if (newCurrentPage > newTotalPages) {
      newCurrentPage = newTotalPages;
    }
    if (newCurrentPage < 1 ) {
        newCurrentPage = 1;
    }
    
    if (newCurrentPage !== currentPage) {
      setCurrentPage(newCurrentPage);
    }
  }, [roadmaps.length, currentPage]); 

  const startIndex = (currentPage - 1) * ROADMAPS_PER_PAGE;
  const endIndex = startIndex + ROADMAPS_PER_PAGE;
  const paginatedRoadmaps = roadmaps.slice(startIndex, endIndex);


  const handleRename = (roadmapId: string) => {
    if (renamingValue.trim()) {
      onRenameRoadmap(roadmapId, renamingValue.trim());
      setRenamingId(null);
      setRenamingValue('');
    } else {
       setGlobalError("Roadmap name cannot be empty.");
    }
  };

  const startRename = (roadmap: Roadmap) => {
    setRenamingId(roadmap.id);
    setRenamingValue(roadmap.name);
  };
  
  // Removed: processImportedRoadmapJSON function
  // Removed: handleImportRoadmapFile function


  return (
    <div className="flex-grow p-6 sm:p-8 bg-slate-100 flex flex-col items-center min-h-screen overflow-y-auto">
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-700">Your Roadmaps</h1>
          <button
            onClick={onOpenCreateRoadmapModal}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
            title="Add New Roadmap"
            aria-label="Add New Roadmap"
          >
            <PlusCircleIcon className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
        </div>
        
        {/* Removed: Import Full Roadmap button */}
        {/* Removed: Hidden file input for full roadmap import */}

        {roadmaps.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-lg">No roadmaps yet. Create one to get started!</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedRoadmaps.map((roadmap) => {
                const stats = roadmapStats.get(roadmap.id);
                return (
                  <div key={roadmap.id} className="p-4 border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50">
                    {renamingId === roadmap.id ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                          className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                          autoFocus
                          onBlur={() => handleRename(roadmap.id)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(roadmap.id)}
                          aria-label="Rename roadmap"
                        />
                        <button
                          onClick={() => handleRename(roadmap.id)}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-grow min-w-0">
                          <span 
                              className="text-lg font-semibold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors block truncate"
                              onClick={() => onSelectRoadmap(roadmap.id)}
                              title={`Open "${roadmap.name}"`}
                          >
                              {roadmap.name}
                          </span>
                          {stats && (
                            <div className="text-xs text-slate-500 mt-1">
                              {stats.totalTasks} task{stats.totalTasks !== 1 ? 's' : ''}
                              {stats.totalTasks > 0 && ` (${stats.completedPercentage}% completed)`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                           <button
                              onClick={() => onViewRoadmapStats(roadmap.id)}
                              className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                              title="View Stats"
                            >
                              <ChartBarIcon className="w-4 h-4" />
                            </button>
                          <button
                            onClick={() => onSelectRoadmap(roadmap.id)}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => startRename(roadmap)}
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                            title="Rename Roadmap"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete roadmap "${roadmap.name}"? This action cannot be undone.`)) {
                                onDeleteRoadmap(roadmap.id);
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                            title="Delete Roadmap"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Removed: ImportDataModalComponent for full roadmap import */}
    </div>
  );
};

export default RoadmapListView;