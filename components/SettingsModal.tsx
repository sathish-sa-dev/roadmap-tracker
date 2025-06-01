
import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal.tsx';
import { AppSettings, StorageLocation } from '../types.ts';
import { DEFAULT_POMODORO_WORK_MINUTES, DEFAULT_POMODORO_BREAK_MINUTES } from '../constants.ts';
import { pickDirectory, verifyDirectoryPermission } from '../services/fileSystemAccess.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings, migrationChoice?: 'move' | 'skip' | null, oldDirectoryHandle?: FileSystemDirectoryHandle | null) => Promise<void>;
  setGlobalError: (message: string | null) => void;
  directoryHandle: FileSystemDirectoryHandle | null; // Current active handle from App.tsx
  setDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void; // To update App.tsx's handle
  currentRoadmapDataForMigrationEstimate: number; 
}

const SettingsModal = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
  setGlobalError,
  directoryHandle, // This is the App.tsx's active directoryHandle
  setDirectoryHandle, // This updates App.tsx's active directoryHandle
  currentRoadmapDataForMigrationEstimate,
}: SettingsModalProps): JSX.Element | null => {
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(currentSettings.storageLocation);
  const [selectedDirectoryNameInModal, setSelectedDirectoryNameInModal] = useState<string | null>(currentSettings.directoryName); // Local display name
  const [pomodoroWorkMinutes, setPomodoroWorkMinutes] = useState(currentSettings.pomodoroWorkMinutes);
  const [pomodoroBreakMinutes, setPomodoroBreakMinutes] = useState(currentSettings.pomodoroBreakMinutes);
  const [isLoading, setIsLoading] = useState(false);
  const [initialDirectoryHandleOnOpen, setInitialDirectoryHandleOnOpen] = useState<FileSystemDirectoryHandle | null>(null);


  useEffect(() => {
    if (isOpen) {
      setStorageLocation(currentSettings.storageLocation);
      setSelectedDirectoryNameInModal(currentSettings.directoryName);
      setPomodoroWorkMinutes(currentSettings.pomodoroWorkMinutes);
      setPomodoroBreakMinutes(currentSettings.pomodoroBreakMinutes);
      setGlobalError(null);
      // Store the directory handle that was active when the modal opened, if current storage is FileSystem
      if (currentSettings.storageLocation === StorageLocation.FileSystem) {
        setInitialDirectoryHandleOnOpen(directoryHandle); 
      } else {
        setInitialDirectoryHandleOnOpen(null);
      }
    }
  }, [isOpen, currentSettings, directoryHandle]);

  const handlePickDirectory = async () => {
    setIsLoading(true);
    setGlobalError(null);
    const handle = await pickDirectory();
    if (handle) {
      if (await verifyDirectoryPermission(handle)) {
        setDirectoryHandle(handle); // Update App.tsx's active handle
        setSelectedDirectoryNameInModal(handle.name); // Update local display name
      } else {
        setDirectoryHandle(null); // Clear App.tsx's active handle
        setSelectedDirectoryNameInModal(null);
        setGlobalError('Permission to access the selected directory was denied. Please choose another directory or grant permission.');
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (storageLocation === StorageLocation.FileSystem && !directoryHandle) {
      setGlobalError('Please select a directory and grant permission if you choose File System storage.');
      return;
    }
    if (pomodoroWorkMinutes < 1 || pomodoroBreakMinutes < 1) {
      setGlobalError('Pomodoro durations must be at least 1 minute.');
      return;
    }

    setIsLoading(true);
    setGlobalError(null);

    const newSettings: AppSettings = {
      storageLocation,
      // directoryName should reflect the name of the *active* directoryHandle if FS is chosen
      directoryName: storageLocation === StorageLocation.FileSystem && directoryHandle ? directoryHandle.name : null,
      pomodoroWorkMinutes: parseInt(String(pomodoroWorkMinutes), 10) || DEFAULT_POMODORO_WORK_MINUTES,
      pomodoroBreakMinutes: parseInt(String(pomodoroBreakMinutes), 10) || DEFAULT_POMODORO_BREAK_MINUTES,
    };

    let migrationChoice: 'move' | 'skip' | null = null;
    const oldStorageLocation = currentSettings.storageLocation;
    const oldDirectoryName = currentSettings.directoryName;

    // Use the initialDirectoryHandleOnOpen for determining the source of migration if old storage was FS
    const oldDirectoryHandleForMigration = (oldStorageLocation === StorageLocation.FileSystem && initialDirectoryHandleOnOpen) 
                                           ? initialDirectoryHandleOnOpen 
                                           : null;

    if (oldStorageLocation !== newSettings.storageLocation || 
        (oldStorageLocation === StorageLocation.FileSystem && oldDirectoryName !== newSettings.directoryName)) {
        
        let promptMessage = '';
        if (newSettings.storageLocation === StorageLocation.FileSystem && oldStorageLocation === StorageLocation.LocalStorage && currentRoadmapDataForMigrationEstimate > 0) {
            promptMessage = `Do you want to move your existing ${currentRoadmapDataForMigrationEstimate} tasks (across all roadmaps) from Local Storage to the selected directory "${newSettings.directoryName}"? If you skip, Local Storage will be cleared.`;
        } else if (newSettings.storageLocation === StorageLocation.LocalStorage && oldStorageLocation === StorageLocation.FileSystem && oldDirectoryName) {
            promptMessage = `Do you want to move your roadmap data from the directory "${oldDirectoryName}" to Local Storage? If you skip, data from "${oldDirectoryName}" will remain, but the app will use Local Storage.`;
        } else if (newSettings.storageLocation === StorageLocation.FileSystem && oldStorageLocation === StorageLocation.FileSystem && oldDirectoryName !== newSettings.directoryName && oldDirectoryName) {
            promptMessage = `Do you want to move your roadmap data from "${oldDirectoryName}" to "${newSettings.directoryName}"? If you skip, data in "${oldDirectoryName}" will remain, but the app will use the new directory.`;
        }

        if (promptMessage) {
            if (window.confirm(promptMessage)) {
                migrationChoice = 'move';
            } else {
                const skipConfirmMessage = `Are you sure you want to skip migration? Data in the previous location might become inaccessible or new location might be empty/outdated.`;
                if(window.confirm(skipConfirmMessage)){
                    migrationChoice = 'skip';
                } else {
                     setIsLoading(false);
                     return; 
                }
            }
        }
    }
    
    try {
      // Pass the potentially new directoryHandle (from prop, updated by handlePickDirectory) to onSaveSettings
      // so App.tsx can use it if it needs to load from it.
      // onSaveSettings will update appSettings in App.tsx, which then re-triggers data loading effect.
      await onSaveSettings(newSettings, migrationChoice, oldDirectoryHandleForMigration);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine current directory name for display, prioritizing the active handle's name
  const displayDirectoryName = directoryHandle ? directoryHandle.name : selectedDirectoryNameInModal;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Settings">
      <div className="space-y-6">
        <fieldset>
          <legend className="text-lg font-medium text-gray-900">Data Storage</legend>
          <p className="text-sm text-gray-500 mb-2">Choose where your roadmap data is stored. Note: For File System, you may need to grant permission each session.</p>
          <div className="mt-2 space-y-2">
            {(Object.values(StorageLocation) as Array<StorageLocation>).map((loc) => (
              <div key={loc} className="flex items-center">
                <input
                  id={`storage-${loc}`}
                  name="storageLocation"
                  type="radio"
                  value={loc}
                  checked={storageLocation === loc}
                  onChange={() => {
                      setStorageLocation(loc);
                      // If switching away from FS, clear the local directory name selection helper
                      if (loc === StorageLocation.LocalStorage) {
                        setSelectedDirectoryNameInModal(null); 
                        // setDirectoryHandle(null); // Don't clear App's handle yet, do it in onSaveSettings in App.tsx
                      }
                  }}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor={`storage-${loc}`} className="ml-3 block text-sm font-medium text-gray-700">
                  {loc === StorageLocation.LocalStorage ? 'Browser Local Storage (Default)' : 'File System (Choose Directory)'}
                </label>
              </div>
            ))}
          </div>
          {storageLocation === StorageLocation.FileSystem && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handlePickDirectory}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (displayDirectoryName ? `Change Directory (Current: ${displayDirectoryName})` : 'Select Directory')}
              </button>
              {displayDirectoryName && <p className="text-xs text-gray-500 mt-1">Selected: {displayDirectoryName}</p>}
               <p className="text-xs text-gray-500 mt-1">The app will use a 'roadmap-data.json' file in the selected directory.</p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-lg font-medium text-gray-900">Pomodoro Timer</legend>
          <div className="mt-2 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="pomodoroWork" className="block text-sm font-medium text-gray-700">Work Duration (minutes)</label>
              <input
                type="number"
                id="pomodoroWork"
                name="pomodoroWork"
                min="1"
                value={pomodoroWorkMinutes}
                onChange={(e) => setPomodoroWorkMinutes(parseInt(e.target.value, 10))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="pomodoroBreak" className="block text-sm font-medium text-gray-700">Break Duration (minutes)</label>
              <input
                type="number"
                id="pomodoroBreak"
                name="pomodoroBreak"
                min="1"
                value={pomodoroBreakMinutes}
                onChange={(e) => setPomodoroBreakMinutes(parseInt(e.target.value, 10))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </fieldset>

        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || (storageLocation === StorageLocation.FileSystem && !directoryHandle)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
    