import React, { useState, useEffect } from 'react';
import Modal from './Modal.tsx'; // Assuming Modal.tsx is in the same directory or path is adjusted
// import {TimeScale} from '../types.ts'; // Unused import

interface CreateRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoadmap: (name: string) => void;
}

const CreateRoadmapModal: React.FC<CreateRoadmapModalProps> = ({ isOpen, onClose, onCreateRoadmap }) => {
  const [roadmapName, setRoadmapName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRoadmapName(''); // Reset name when modal opens
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmapName.trim()) {
      setError('Roadmap name cannot be empty.');
      return;
    }
    onCreateRoadmap(roadmapName.trim());
    // onClose(); // App.tsx will handle closing via handleCreateRoadmap
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Roadmap">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newRoadmapNameModal" className="block text-sm font-medium text-gray-700">
            Roadmap Name
          </label>
          <input
            type="text"
            id="newRoadmapNameModal"
            value={roadmapName}
            onChange={(e) => setRoadmapName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Roadmap
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoadmapModal;