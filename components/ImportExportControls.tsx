import React, { useRef, useState } from 'react';
import { Task, TimeScale, Roadmap, AllRoadmapsData } from '../types.ts'; 
import ImportDataModalComponent from './ImportDataModal.tsx'; // Changed component name
import { parseCSVToTasks } from '../services/csvParser.ts';

interface ImportExportControlsProps {
  activeRoadmap: Roadmap | null; 
  onImportTasksToActiveRoadmap: (newTasks: Task[]) => void;
  setErrorMessage: (message: string | null) => void;
}

const ImportExportControls: React.FC<ImportExportControlsProps> = ({ 
  activeRoadmap, 
  onImportTasksToActiveRoadmap, 
  setErrorMessage 
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);

  const processTasksJSONString = (jsonString: string, closeModal: () => void) => {
    try {
      const importedTasks = JSON.parse(jsonString) as Partial<Task>[];
      if (Array.isArray(importedTasks)) {
        const isValidTasks = importedTasks.every((task: any) =>
          typeof task.id === 'string' && 
          typeof task.name === 'string' &&
          typeof task.startDate === 'string' &&
          typeof task.endDate === 'string' &&
          typeof task.completed === 'boolean' &&
          (typeof task.notes === 'string' || typeof task.notes === 'undefined') &&
          (typeof task.category === 'string' || typeof task.category === 'undefined')
        );
        if (isValidTasks) {
          const tasksWithDefaults = importedTasks.map(task => ({
            id: task.id || crypto.randomUUID(),
            name: task.name!,
            startDate: task.startDate!,
            endDate: task.endDate!,
            completed: task.completed || false,
            notes: task.notes || '',
            category: task.category || undefined,
          })) as Task[];
          onImportTasksToActiveRoadmap(tasksWithDefaults);
          setErrorMessage(null);
          closeModal();
        } else {
          throw new Error("Imported JSON tasks have incorrect structure or missing required fields.");
        }
      } else {
        throw new Error("Invalid JSON format. Expected an array of Task objects.");
      }
    } catch (error) {
      console.error("Error parsing Tasks JSON string:", error);
      setErrorMessage(`Error importing Tasks JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const processCSVString = (csvString: string, closeModal: () => void) => {
    try {
      const newTasks = parseCSVToTasks(csvString); 
      onImportTasksToActiveRoadmap(newTasks);
      setErrorMessage(null);
      closeModal();
    } catch (error) {
      console.error("Error parsing CSV string:", error);
      setErrorMessage(`Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportTasksJSONFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processTasksJSONString(result, () => setIsJsonImportModalOpen(false));
        }
        if (jsonInputRef.current) jsonInputRef.current.value = ""; 
      };
      reader.readAsText(file);
    }
  };

  const handleImportCSVFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processCSVString(result, () => setIsCsvImportModalOpen(false)); 
        }
        if (csvInputRef.current) csvInputRef.current.value = ""; 
      };
      reader.readAsText(file);
    }
  };
  
  const handleExportActiveRoadmapJSON = () => {
    if (!activeRoadmap) {
      setErrorMessage("No active roadmap to export.");
      return;
    }
    const dataToExport: Roadmap = activeRoadmap; 
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeRoadmap.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'roadmap'}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setErrorMessage(null);
  };


  if (!activeRoadmap) { 
    return null;
  }

  return (
    <>
      <div className="p-4 bg-slate-100 border-t border-slate-300 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        <span className="text-sm font-medium text-gray-700 hidden sm:block">For roadmap "{activeRoadmap.name}":</span>
        <button
          type="button"
          onClick={() => setIsJsonImportModalOpen(true)}
          className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          title="Import tasks from a JSON array into the current roadmap"
        >
          Import Tasks (JSON)
        </button>
        <input type="file" ref={jsonInputRef} onChange={handleImportTasksJSONFile} accept=".json" className="hidden" />

        <button
          type="button"
          onClick={() => setIsCsvImportModalOpen(true)}
          className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          title="Import tasks from a CSV file into the current roadmap"
        >
          Import Tasks (CSV)
        </button>
        <input type="file" ref={csvInputRef} onChange={handleImportCSVFile} accept=".csv" className="hidden" />
        
        <button
          type="button"
          onClick={handleExportActiveRoadmapJSON}
          className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          title="Export the current roadmap (tasks and settings) to a JSON file"
        >
          Export Active Roadmap (JSON)
        </button>
      </div>

      <ImportDataModalComponent
        isOpen={isJsonImportModalOpen}
        onClose={() => setIsJsonImportModalOpen(false)}
        dataType="JSON (Tasks List)"
        onRequestFileUpload={() => jsonInputRef.current?.click()}
        onProcessPastedText={(text) => processTasksJSONString(text, () => setIsJsonImportModalOpen(false))}
        contextText={`Importing tasks into "${activeRoadmap.name}"`}
        exampleText='Example: [{"id": "task1", "name":"My Task", "startDate":"YYYY-MM-DD", ...}]'
      />

      <ImportDataModalComponent
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        dataType="CSV (Tasks List)"
        onRequestFileUpload={() => csvInputRef.current?.click()}
        onProcessPastedText={(text) => processCSVString(text, () => setIsCsvImportModalOpen(false))}
        contextText={`Importing tasks into "${activeRoadmap.name}"`}
        exampleText='Example CSV: name,startDate,endDate,category\nTask A,2024-01-01,2024-01-05,Dev'
      />
    </>
  );
};

export default ImportExportControls;