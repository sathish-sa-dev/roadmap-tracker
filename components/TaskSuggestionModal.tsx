import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal.tsx';
import { TimeGroup, Task } from '../types.ts';
import { fetchNextTaskSuggestion, PrioritizedTaskSuggestion } from '../services/geminiService.ts';
import SparklesIcon from './icons/SparklesIcon.tsx';

interface TaskSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: TimeGroup | null;
  tasksInGroup: Task[]; 
  setGlobalError: (message: string | null) => void;
}

const TaskSuggestionModal = ({
  isOpen,
  onClose,
  selectedGroup,
  tasksInGroup,
  setGlobalError,
}: TaskSuggestionModalProps): JSX.Element | null => {
  const [suggestion, setSuggestion] = useState<PrioritizedTaskSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrioritizedSuggestion = useCallback(async () => {
    if (!selectedGroup || tasksInGroup.length === 0) {
      setError(tasksInGroup.length === 0 ? "No tasks in this group to prioritize." : "Selected group is invalid.");
      setSuggestion(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const fetchedSuggestion = await fetchNextTaskSuggestion(selectedGroup, tasksInGroup);
      if (fetchedSuggestion) {
        setSuggestion(fetchedSuggestion);
      } else {
        setError("AI could not determine a next task. Try again or check your tasks.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to load suggestion: \${errorMessage}`);
      if (errorMessage.toLowerCase().includes("api key")) {
        setGlobalError(`Gemini API Error: \${errorMessage}. Please ensure your API key is correctly configured.`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroup, tasksInGroup, setGlobalError]);

  useEffect(() => {
    if (isOpen && selectedGroup) {
      loadPrioritizedSuggestion();
    } else if (!isOpen) {
      // Reset state when modal is closed or becomes hidden
      setSuggestion(null);
      setError(null);
      setIsLoading(false); // Ensure loading is also reset
    }
  }, [isOpen, selectedGroup, loadPrioritizedSuggestion]);
  
  const renderContent = (): JSX.Element | null => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">AI is analyzing your tasks...</p>
        </div>
      );
    }
    if (error) {
      return <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>;
    }
    if (!suggestion && !isLoading) {
         if (tasksInGroup.length === 0) {
             return <p className="text-gray-500 py-6 text-center">There are no tasks in this time block for the AI to prioritize.</p>;
         }
      return <p className="text-gray-500 py-6 text-center">No suggestion available. Try regenerating.</p>;
    }
    if (suggestion) {
      return (
        <div className="space-y-3 py-4">
          <h3 className="text-lg font-semibold text-gray-800">Recommended Next Task:</h3>
          <div className="p-4 border rounded-md bg-blue-50 border-blue-200 shadow">
            <p className="text-xl font-medium text-blue-700">{suggestion.taskName}</p>
          </div>
          <h4 className="text-md font-semibold text-gray-700 pt-2">Reasoning:</h4>
          <p className="text-gray-600 italic p-3 bg-gray-50 rounded-md border border-gray-200">{suggestion.reason}</p>
        </div>
      );
    }
    return null; // Fallback, ensures function always returns JSX or null
  };

  // The Modal component will return null if its 'isOpen' prop is false.
  // This component passes its own 'isOpen' prop to the Modal.
  // Thus, TaskSuggestionModal effectively returns JSX.Element (when isOpen is true and Modal renders) 
  // or null (when isOpen is false and Modal returns null).
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Next Task Suggestion for \${selectedGroup?.label || 'Time Block'}`}>
      <div className="space-y-4">
        {renderContent()}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t mt-4 gap-3">
          <button
            type="button"
            onClick={loadPrioritizedSuggestion}
            disabled={isLoading || !selectedGroup || tasksInGroup.length === 0}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
          >
            <SparklesIcon className="w-4 h-4 mr-2"/>
            Regenerate Suggestion
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskSuggestionModal;
