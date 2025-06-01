import React from 'react';
import { Task, TimeGroup } from '../types.ts';
import TaskItem from './TaskItem.tsx';
import PlusIcon from './icons/PlusIcon.tsx';
import SparklesIcon from './icons/SparklesIcon.tsx';

interface CenterPanelProps {
  selectedGroup: TimeGroup | null;
  tasksInGroup: Task[];
  editingTaskId: string | null;
  onToggleComplete: (taskId: string) => void;
  onNotesChange: (taskId: string, notes: string) => void;
  onSelectForEditing: (taskId: string | null) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddTaskModal: () => void;
  onOpenTaskSuggestionModal: () => void;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  selectedGroup,
  tasksInGroup,
  editingTaskId,
  onToggleComplete,
  onNotesChange,
  onSelectForEditing,
  onDeleteTask,
  onOpenAddTaskModal,
  onOpenTaskSuggestionModal,
}) => {
  if (!selectedGroup) {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center text-gray-500 bg-white rounded-lg shadow-lg h-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xl text-center">Select a time block from the left panel to view tasks.</p>
        <p className="mt-2 text-sm text-center">Or, add a new task to get started.</p>
         <button
            type="button"
            onClick={onOpenAddTaskModal}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Task
        </button>
      </div>
    );
  }

  const canSuggestTasks = tasksInGroup.length > 0;

  return (
    <div className="flex-grow p-6 bg-white rounded-lg shadow-lg overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 truncate">{selectedGroup.label}</h2>
        <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
          <button
              type="button"
              onClick={onOpenTaskSuggestionModal}
              disabled={!canSuggestTasks}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title={canSuggestTasks ? "Let AI suggest your next task" : "Add tasks to this group to enable AI suggestions"}
          >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Suggest Next Task
          </button>
          <button
              type="button"
              onClick={onOpenAddTaskModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Task
          </button>
        </div>
      </div>
      
      {tasksInGroup.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-700">No tasks in this period</h3>
          <p className="mt-1 text-sm">Create a new task for this time block or select another one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasksInGroup.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isEditing={editingTaskId === task.id}
              onToggleComplete={onToggleComplete}
              onNotesChange={onNotesChange}
              onSelectForEditing={onSelectForEditing}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CenterPanel;