import React from 'react';
import { TimeScale, TimeGroup } from '../types';

interface LeftPanelProps {
  timeGroups: TimeGroup[];
  selectedTimeGroupKey: string | null;
  onSelectTimeGroup: (key: string) => void;
  currentTimeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ timeGroups, selectedTimeGroupKey, onSelectTimeGroup, currentTimeScale, onTimeScaleChange }) => {
  return (
    <div className="bg-slate-50 p-4 h-full flex flex-col shadow-lg rounded-lg">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">View By</h2>
        <div className="flex space-x-2">
          {(Object.values(TimeScale) as Array<TimeScale>).map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => onTimeScaleChange(scale)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${currentTimeScale === scale ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
            >
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Time Blocks</h2>
      {timeGroups.length === 0 && (
         <p className="text-sm text-gray-500 italic">No time blocks available. Add tasks to see them here.</p>
      )}
      <div className="overflow-y-auto flex-grow pr-1 space-y-1 -mr-2"> {/* Added pr-1 and -mr-2 for better scrollbar appearance */}
        {timeGroups.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelectTimeGroup(group.key)}
            className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-150
              ${selectedTimeGroupKey === group.key 
                ? 'bg-blue-500 text-white font-semibold shadow-md ring-2 ring-blue-300' 
                : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 focus:ring-1 focus:ring-blue-400 focus:outline-none'}`}
          >
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeftPanel;