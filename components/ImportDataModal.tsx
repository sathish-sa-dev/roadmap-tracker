import React, { useState, useEffect } from 'react';
import Modal from './Modal.tsx';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: string; 
  onProcessPastedText: (pastedText: string) => void;
  onRequestFileUpload: () => void;
  contextText?: string; 
  exampleText?: string; 
}

const ImportDataModalComponent: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  dataType,
  onProcessPastedText,
  onRequestFileUpload,
  contextText,
  exampleText,
}) => {
  const [view, setView] = useState<'choice' | 'paste'>('choice');
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setView('choice');
      setPastedText('');
      setError(null);
    }
  }, [isOpen, dataType]);

  const handleUploadFileClick = () => {
    onRequestFileUpload();
    onClose(); 
  };

  const handlePasteContentClick = () => {
    setView('paste');
    setError(null);
  };

  const handleProcessPaste = () => {
    if (!pastedText.trim()) {
      setError(`Pasted ${dataType} content cannot be empty.`);
      return;
    }
    setError(null);
    onProcessPastedText(pastedText);
  };

  const handleBackToChoice = () => {
    setView('choice');
    setPastedText('');
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Import ${dataType} Data`}>
      {contextText && <p className="text-sm text-gray-600 mb-3 -mt-2">{contextText}</p>}
      {view === 'choice' ? (
        <div className="space-y-4 py-4">
          <button
            type="button"
            onClick={handleUploadFileClick}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload a .{dataType.toLowerCase().split(' ')[0]} file
          </button>
          <button
            type="button"
            onClick={handlePasteContentClick}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Paste {dataType} content
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="pastedContent" className="block text-sm font-medium text-gray-700 mb-1">
              Paste your {dataType} content below:
            </label>
            <textarea
              id="pastedContent"
              rows={10}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-xs"
              placeholder={exampleText || `Paste your ${dataType} data here...`}
              aria-describedby={error ? "paste-error" : undefined}
            />
            {error && <p id="paste-error" className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={handleBackToChoice}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to options
            </button>
            <button
              type="button"
              onClick={handleProcessPaste}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Import Pasted Content
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Explicitly re-typing the export line. This is unlikely to fix a genuine issue if the original was already correct.
export default ImportDataModalComponent;