import React from 'react';
import { Task } from '../types.ts';
import RichTextEditor from './RichTextEditor.tsx';
import PencilIcon from './icons/PencilIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import { getFormattedDate } from '../services/dateUtils.ts';

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  onToggleComplete: (taskId: string) => void;
  onNotesChange: (taskId: string, notes: string) => void;
  onSelectForEditing: (taskId: string | null) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isEditing, onToggleComplete, onNotesChange, onSelectForEditing, onDeleteTask }) => {
  return (
    <div className={`p-4 border rounded-lg shadow-sm transition-all duration-200 ${task.completed ? 'bg-green-50 border-green-200 opacity-75' : 'bg-white border-gray-200'} ${isEditing ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task.id)}
            className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
            aria-labelledby={`task-name-${task.id}`}
          />
          <div className="flex-grow">
            <span id={`task-name-${task.id}`} className={`text-lg font-medium break-words ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {task.name}
            </span>
            <div className="text-xs text-gray-500 mt-0.5 space-x-2">
              <span>{getFormattedDate(task.startDate)} - {getFormattedDate(task.endDate)}</span>
              {task.category && (
                <span className="inline-block bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                  {task.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectForEditing(isEditing ? null : task.id)}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            title={isEditing ? "Close Notes" : "Edit Notes"}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete task "${task.name}"?`)) {
                onDeleteTask(task.id);
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
            title="Delete Task"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {isEditing && (
        <div className="mt-4">
          <RichTextEditor
            content={task.notes}
            onChange={(newNotes) => onNotesChange(task.id, newNotes)}
            placeholder="Add your notes here..."
          />
        </div>
      )}
    </div>
  );
};

export default TaskItem;