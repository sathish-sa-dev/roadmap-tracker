import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TimeScale, TimeGroup, AppSettings, StorageLocation, Roadmap, AllRoadmapsData, CalculatedTaskStats } from './types.ts';
import { LOCAL_STORAGE_KEY, APP_SETTINGS_KEY, DEFAULT_POMODORO_WORK_MINUTES, DEFAULT_POMODORO_BREAK_MINUTES } from './constants.ts';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { groupTasks, filterTasksForGroup, formatDateToYYYYMMDD } from './services/dateUtils.ts';
import { verifyDirectoryPermission, loadAllRoadmapsDataFromHandle, saveAllRoadmapsDataToHandle } from './services/fileSystemAccess.ts';
import { calculateRoadmapTaskStats } from './services/analyticsUtils.ts';

import LeftPanel from './components/LeftPanel.tsx';
import CenterPanel from './components/CenterPanel.tsx';
import PomodoroTimer from './components/PomodoroTimer.tsx';
import ImportExportControls from './components/ImportExportControls.tsx';
import AddTaskModal from './components/AddTaskModal.tsx';
import TaskSuggestionModal from './components/TaskSuggestionModal.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import RoadmapListView from './components/RoadmapListView.tsx'; 
import CreateRoadmapModal from './components/CreateRoadmapModal.tsx';
import RoadmapAnalyticsModal from './components/RoadmapAnalyticsModal.tsx';
import CogIcon from './components/icons/CogIcon.tsx';
import ChevronLeftIcon from './components/icons/ChevronLeftIcon.tsx';

const App = (): JSX.Element => {
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>(APP_SETTINGS_KEY, {
    storageLocation: StorageLocation.LocalStorage,
    directoryName: null,
    pomodoroWorkMinutes: DEFAULT_POMODORO_WORK_MINUTES,
    pomodoroBreakMinutes: DEFAULT_POMODORO_BREAK_MINUTES,
  });

  const defaultAllRoadmapsData: AllRoadmapsData = useMemo(() => ({
    roadmaps: [],
    pomodoroSessions: [],
    activePomodoroTaskDetails: null,
  }), []);

  const [allRoadmapsData, setAllRoadmapsData] = useState<AllRoadmapsData>(defaultAllRoadmapsData);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  
  const [localStoredAllRoadmaps, setLocalStoredAllRoadmaps] = useLocalStorage<AllRoadmapsData>(LOCAL_STORAGE_KEY, defaultAllRoadmapsData);

  const [selectedTimeGroupKey, setSelectedTimeGroupKey] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isTaskSuggestionModalOpen, setIsTaskSuggestionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedRoadmapForAnalyticsId, setSelectedRoadmapForAnalyticsId] = useState<string | null>(null);
  const [isCreateRoadmapModalOpen, setIsCreateRoadmapModalOpen] = useState(false); 

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const activeRoadmap = useMemo(() => {
    return allRoadmapsData.roadmaps.find(r => r.id === activeRoadmapId) || null;
  }, [allRoadmapsData.roadmaps, activeRoadmapId]);

  const selectedRoadmapForAnalytics = useMemo(() => {
    return allRoadmapsData.roadmaps.find(r => r.id === selectedRoadmapForAnalyticsId) || null;
  }, [allRoadmapsData.roadmaps, selectedRoadmapForAnalyticsId]);

  const analyticsForSelectedRoadmap = useMemo(() => {
    if (!selectedRoadmapForAnalytics) return null;
    return calculateRoadmapTaskStats(selectedRoadmapForAnalytics);
  }, [selectedRoadmapForAnalytics]);


  const migrateOldData = useCallback((oldData: any): AllRoadmapsData => {
    if (oldData && Array.isArray(oldData.tasks) && oldData.timeScale && !oldData.roadmaps) {
      console.log("Migrating old single-roadmap data format...");
      const defaultRoadmap: Roadmap = {
        id: crypto.randomUUID(),
        name: "My Default Roadmap",
        tasks: oldData.tasks as Task[],
        timeScale: oldData.timeScale as TimeScale,
      };
      return { 
        roadmaps: [defaultRoadmap], 
        pomodoroSessions: oldData.pomodoroSessions || [], 
        activePomodoroTaskDetails: oldData.activePomodoroTaskDetails || null 
      };
    }
    if (oldData && Array.isArray(oldData.roadmaps)) {
        return {
            roadmaps: oldData.roadmaps,
            pomodoroSessions: oldData.pomodoroSessions || [],
            activePomodoroTaskDetails: oldData.activePomodoroTaskDetails || null,
        };
    }
    return defaultAllRoadmapsData;
  }, [defaultAllRoadmapsData]);


  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setGlobalError(null);
      let loadedData: AllRoadmapsData | null = null;

      if (appSettings.storageLocation === StorageLocation.FileSystem) {
        if (directoryHandle) {
          if (await verifyDirectoryPermission(directoryHandle)) {
            loadedData = await loadAllRoadmapsDataFromHandle(directoryHandle);
          } else {
            setGlobalError("Permission denied for the selected directory. Please re-select or grant permissions via Settings.");
            setDirectoryHandle(null); 
            let localFallbackString = localStorage.getItem(LOCAL_STORAGE_KEY);
            let rawLocalFallback = null;
            try {
                rawLocalFallback = localFallbackString ? JSON.parse(localFallbackString) : null;
            } catch (e) { console.error("Error parsing fallback LocalStorage data during FS failure", e); }
            loadedData = migrateOldData(rawLocalFallback || defaultAllRoadmapsData);
          }
        } else { 
          if(appSettings.directoryName){ 
             setGlobalError(`File System storage is selected for "${appSettings.directoryName}", but directory access needs to be granted again. Please go to Settings to re-select it.`);
          }
          loadedData = defaultAllRoadmapsData;
        }
      } else { 
        const rawLocalDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let rawLocalData = null;
        try {
            rawLocalData = rawLocalDataString ? JSON.parse(rawLocalDataString) : defaultAllRoadmapsData;
        } catch (e) {
            console.error("Error parsing LocalStorage data, using default.", e);
            rawLocalData = defaultAllRoadmapsData;
        }
        
        loadedData = migrateOldData(rawLocalData);

        if (JSON.stringify(loadedData) !== JSON.stringify(rawLocalData) && rawLocalDataString && rawLocalData !== defaultAllRoadmapsData) { 
            setLocalStoredAllRoadmaps(loadedData);
        } else if (!rawLocalDataString) { 
            setLocalStoredAllRoadmaps(defaultAllRoadmapsData);
        }
      }
      
      setAllRoadmapsData(loadedData || defaultAllRoadmapsData);
      if (activeRoadmapId && !(loadedData?.roadmaps.some(r => r.id === activeRoadmapId))) {
        setActiveRoadmapId(null); 
      }
      setIsLoadingData(false);
    };
    loadData();
  }, [appSettings.storageLocation, directoryHandle, migrateOldData, defaultAllRoadmapsData, setLocalStoredAllRoadmaps, activeRoadmapId]); 

  useEffect(() => {
    if (isLoadingData) return; 

    if (appSettings.storageLocation === StorageLocation.FileSystem) {
      if (directoryHandle) {
        saveAllRoadmapsDataToHandle(directoryHandle, allRoadmapsData).catch(err => {
          setGlobalError(`Failed to save data to file system: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    } else { 
      setLocalStoredAllRoadmaps(allRoadmapsData);
    }
  }, [allRoadmapsData, appSettings.storageLocation, directoryHandle, setLocalStoredAllRoadmaps, isLoadingData]);


  const timeGroups: TimeGroup[] = useMemo(() => {
    if (!activeRoadmap) return [];
    return groupTasks(activeRoadmap.tasks, activeRoadmap.timeScale);
  }, [activeRoadmap]);

  useEffect(() => {
    if (activeRoadmap) {
        if (timeGroups.length > 0) {
            const currentGroupExists = timeGroups.find(g => g.key === selectedTimeGroupKey);
            if (!selectedTimeGroupKey || !currentGroupExists) {
                setSelectedTimeGroupKey(timeGroups[0].key);
            }
        } else if (timeGroups.length === 0) {
            setSelectedTimeGroupKey(null);
        }
    } else {
        setSelectedTimeGroupKey(null);
    }
  }, [timeGroups, selectedTimeGroupKey, activeRoadmap]);


  const selectedGroupObject = useMemo(() => {
    if (!activeRoadmap) return null;
    return timeGroups.find(group => group.key === selectedTimeGroupKey) || null;
  }, [timeGroups, selectedTimeGroupKey, activeRoadmap]);

  const tasksInSelectedGroup = useMemo(() => {
    if (!activeRoadmap || !selectedGroupObject) return [];
    return filterTasksForGroup(activeRoadmap.tasks, selectedGroupObject)
           .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [activeRoadmap, selectedGroupObject]);

  const handleTimeScaleChange = useCallback((newScale: TimeScale) => {
    if (!activeRoadmapId) return;
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => r.id === activeRoadmapId ? {...r, timeScale: newScale} : r)
    }));
    setEditingTaskId(null);
    setGlobalError(null);
  }, [activeRoadmapId]);

  const handleSelectTimeGroup = useCallback((key: string) => {
    setSelectedTimeGroupKey(key);
    setEditingTaskId(null);
    setGlobalError(null);
  }, []);

  const handleToggleComplete = useCallback((taskId: string) => {
    if (!activeRoadmapId) return;
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => 
            r.id === activeRoadmapId ? 
            {...r, tasks: r.tasks.map(t => t.id === taskId ? {...t, completed: !t.completed} : t)} 
            : r)
    }));
  }, [activeRoadmapId]);

  const handleNotesChange = useCallback((taskId: string, notes: string) => {
    if (!activeRoadmapId) return;
     setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => 
            r.id === activeRoadmapId ? 
            {...r, tasks: r.tasks.map(t => t.id === taskId ? {...t, notes} : t)} 
            : r)
    }));
  }, [activeRoadmapId]);

  const handleSelectForEditing = useCallback((taskId: string | null) => {
    setEditingTaskId(taskId);
  }, []);

  const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'completed' | 'notes'>) => {
    if (!activeRoadmapId) return;
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      notes: '',
    };
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => 
            r.id === activeRoadmapId ? 
            {...r, tasks: [...r.tasks, newTask].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())} 
            : r)
    }));
    setGlobalError(null);
  }, [activeRoadmapId]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!activeRoadmapId) return;
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => 
            r.id === activeRoadmapId ? 
            {...r, tasks: r.tasks.filter(t => t.id !== taskId)} 
            : r)
    }));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
    setAllRoadmapsData(prev => {
      if (prev.activePomodoroTaskDetails?.roadmapId === activeRoadmapId && prev.activePomodoroTaskDetails?.taskId === taskId) {
        return { ...prev, activePomodoroTaskDetails: null };
      }
      return prev;
    });
    setGlobalError(null);
  }, [activeRoadmapId, editingTaskId]);

  const handleImportTasksToActiveRoadmap = useCallback((newTasks: Task[]) => {
    if (!activeRoadmapId) {
        setGlobalError("No active roadmap selected to import tasks into.");
        return;
    }
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => 
            r.id === activeRoadmapId ? 
            {...r, tasks: [...r.tasks, ...newTasks].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())}
            : r)
    }));
    setEditingTaskId(null);
    setGlobalError(null);
    alert(`${newTasks.length} tasks imported successfully into "${activeRoadmap?.name}"!`);
  }, [activeRoadmapId, activeRoadmap?.name]);

  const handleOpenCreateRoadmapModal = useCallback(() => {
    setIsCreateRoadmapModalOpen(true);
  }, []);

  const handleCloseCreateRoadmapModal = useCallback(() => {
    setIsCreateRoadmapModalOpen(false);
  }, []);

  const handleCreateRoadmap = useCallback((name: string) => {
    const newRoadmap: Roadmap = {
      id: crypto.randomUUID(),
      name,
      tasks: [],
      timeScale: TimeScale.Weekly,
    };
    setAllRoadmapsData(prev => ({...prev, roadmaps: [...prev.roadmaps, newRoadmap]}));
    setIsCreateRoadmapModalOpen(false); 
    setActiveRoadmapId(newRoadmap.id); // Automatically select the new roadmap
    setGlobalError(null);
  }, []);

  const handleSelectRoadmap = useCallback((roadmapId: string) => {
    setActiveRoadmapId(roadmapId);
    setSelectedTimeGroupKey(null); 
    setEditingTaskId(null); 
    setGlobalError(null);
  }, []);

  const handleRenameRoadmap = useCallback((roadmapId: string, newName: string) => {
    setAllRoadmapsData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(r => r.id === roadmapId ? {...r, name: newName} : r)
    }));
  }, []);

  const handleDeleteRoadmap = useCallback((roadmapId: string) => {
    setAllRoadmapsData(prev => {
        const updatedRoadmaps = prev.roadmaps.filter(r => r.id !== roadmapId);
        let updatedActivePomodoroTaskDetails = prev.activePomodoroTaskDetails;
        if (prev.activePomodoroTaskDetails?.roadmapId === roadmapId) {
            updatedActivePomodoroTaskDetails = null;
        }
        return {
            ...prev,
            roadmaps: updatedRoadmaps,
            activePomodoroTaskDetails: updatedActivePomodoroTaskDetails,
        };
    });

    if (activeRoadmapId === roadmapId) {
      setActiveRoadmapId(null);
    }
    if (selectedRoadmapForAnalyticsId === roadmapId) {
      setIsAnalyticsModalOpen(false);
      setSelectedRoadmapForAnalyticsId(null);
    }
  }, [activeRoadmapId, selectedRoadmapForAnalyticsId]);

  // Removed: handleImportFullRoadmap function
  
  const handleGoToRoadmapList = useCallback(() => {
      setActiveRoadmapId(null);
  }, []);

  const handleViewRoadmapStats = useCallback((roadmapId: string) => {
    setSelectedRoadmapForAnalyticsId(roadmapId);
    setIsAnalyticsModalOpen(true);
  }, []);


  const handleSaveSettings = useCallback(async (
    newSettings: AppSettings,
    migrationChoice?: 'move' | 'skip' | null,
    oldDirectoryHandleForMigration?: FileSystemDirectoryHandle | null
  ) => {
    setGlobalError(null);
    const oldSettings = appSettings;
    let dataToMigrate: AllRoadmapsData | null = null;

    if (migrationChoice === 'move') {
      if (oldSettings.storageLocation === StorageLocation.LocalStorage && newSettings.storageLocation === StorageLocation.FileSystem) {
        dataToMigrate = localStoredAllRoadmaps;
      } else if (oldSettings.storageLocation === StorageLocation.FileSystem && newSettings.storageLocation === StorageLocation.LocalStorage && oldDirectoryHandleForMigration) {
        dataToMigrate = await loadAllRoadmapsDataFromHandle(oldDirectoryHandleForMigration);
      } else if (oldSettings.storageLocation === StorageLocation.FileSystem && newSettings.storageLocation === StorageLocation.FileSystem && oldSettings.directoryName !== newSettings.directoryName && oldDirectoryHandleForMigration) {
        dataToMigrate = await loadAllRoadmapsDataFromHandle(oldDirectoryHandleForMigration);
      }
    }
    
    setAppSettings(newSettings);

    if (newSettings.storageLocation === StorageLocation.LocalStorage) {
        setDirectoryHandle(null); 
    }
    
    if (migrationChoice === 'move' && dataToMigrate) {
      const targetDirectoryHandle = newSettings.storageLocation === StorageLocation.FileSystem ? directoryHandle : null;

      if (newSettings.storageLocation === StorageLocation.FileSystem && targetDirectoryHandle) {
        await saveAllRoadmapsDataToHandle(targetDirectoryHandle, dataToMigrate);
        setAllRoadmapsData(dataToMigrate); 
        if (oldSettings.storageLocation === StorageLocation.LocalStorage) { 
          setLocalStoredAllRoadmaps(defaultAllRoadmapsData); 
        }
      } else if (newSettings.storageLocation === StorageLocation.LocalStorage) {
        setLocalStoredAllRoadmaps(dataToMigrate); 
        setAllRoadmapsData(dataToMigrate);
      }
    } else if (migrationChoice === 'skip') {
        if (oldSettings.storageLocation === StorageLocation.LocalStorage && newSettings.storageLocation === StorageLocation.FileSystem) {
            setLocalStoredAllRoadmaps(defaultAllRoadmapsData); 
        }
         if (newSettings.storageLocation === StorageLocation.LocalStorage) {
            let rawLocalString = localStorage.getItem(LOCAL_STORAGE_KEY);
            let rawLocal = null;
            try { rawLocal = rawLocalString ? JSON.parse(rawLocalString) : null; } catch(e) { console.error(e); }
            setAllRoadmapsData(migrateOldData(rawLocal || defaultAllRoadmapsData));
        } else if (newSettings.storageLocation === StorageLocation.FileSystem && directoryHandle) { 
            const fsData = await loadAllRoadmapsDataFromHandle(directoryHandle);
            setAllRoadmapsData(fsData || defaultAllRoadmapsData);
        } else if (newSettings.storageLocation === StorageLocation.FileSystem && !directoryHandle) {
            setAllRoadmapsData(defaultAllRoadmapsData); 
            if(newSettings.directoryName) { 
                setGlobalError("File System selected. Please re-select the directory in Settings to load/save data.");
            }
        }
    }
    
    setIsSettingsModalOpen(false);
  }, [appSettings, localStoredAllRoadmaps, setAppSettings, directoryHandle, migrateOldData, defaultAllRoadmapsData]);

  let content: JSX.Element;

  if (isLoadingData) {
    content = (
      <div className="flex justify-center items-center h-screen bg-slate-200">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-xl text-gray-700">Loading Roadmap Data...</p>
      </div>
    );
  } else if (!activeRoadmap) {
    content = (
      <>
        <RoadmapListView 
          roadmaps={allRoadmapsData.roadmaps}
          onSelectRoadmap={handleSelectRoadmap}
          onOpenCreateRoadmapModal={handleOpenCreateRoadmapModal} 
          onRenameRoadmap={handleRenameRoadmap}
          onDeleteRoadmap={handleDeleteRoadmap}
          // Removed onImportFullRoadmap prop
          onViewRoadmapStats={handleViewRoadmapStats}
          setGlobalError={setGlobalError}
        />
        <CreateRoadmapModal
          isOpen={isCreateRoadmapModalOpen}
          onClose={handleCloseCreateRoadmapModal}
          onCreateRoadmap={handleCreateRoadmap}
        />
         {isAnalyticsModalOpen && selectedRoadmapForAnalytics && (
          <RoadmapAnalyticsModal
            isOpen={isAnalyticsModalOpen}
            onClose={() => setIsAnalyticsModalOpen(false)}
            roadmap={selectedRoadmapForAnalytics}
            stats={analyticsForSelectedRoadmap}
          />
        )}
      </>
    );
  } else {
    content = (
      <div className="flex flex-col h-screen max-h-screen bg-slate-200 text-gray-800 font-sans">
        <header className="p-3 sm:p-4 bg-slate-800 text-white flex justify-between items-center shadow-lg shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
              <button
                  onClick={handleGoToRoadmapList}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-700 transition-colors flex items-center text-sm"
                  title="Back to Roadmaps List"
                  aria-label="Go back to roadmaps list"
              >
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  <span className="hidden sm:inline ml-1">Roadmaps</span>
              </button>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate" title={activeRoadmap.name}>
                  {activeRoadmap.name}
              </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <PomodoroTimer 
              workDuration={appSettings.pomodoroWorkMinutes * 60}
              breakDuration={appSettings.pomodoroBreakMinutes * 60}
            />
          </div>
        </header>

        {globalError && (
          <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 m-2 rounded-md shadow-md shrink-0" role="alert">
            <div className="flex">
              <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828-1.415-1.415L10 8.586 7.172 5.757 5.757 7.172 8.586 10l-2.829 2.828 1.415 1.415L10 11.414l2.828 2.829 1.415-1.415L11.414 10z"/></svg></div>
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm">{globalError}</p>
              </div>
               <button onClick={() => setGlobalError(null)} className="ml-auto text-red-500 hover:text-red-700" aria-label="Dismiss error">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
            </div>
          </div>
        )}
        
        {isLoadingData && appSettings.storageLocation === StorageLocation.FileSystem && !directoryHandle && appSettings.directoryName && (
          <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 m-2 rounded-md shadow-md shrink-0" role="alert">
            File System storage is selected for "{appSettings.directoryName}". Please re-select the directory in Settings to load or save data.
          </div>
        )}


        <div className="flex flex-grow overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
          <aside className="w-1/3 lg:w-1/4 xl:w-1/5 min-w-[260px] sm:min-w-[280px] max-w-[380px] h-full overflow-hidden flex flex-col">
            <LeftPanel
              timeGroups={timeGroups}
              selectedTimeGroupKey={selectedTimeGroupKey}
              onSelectTimeGroup={handleSelectTimeGroup}
              currentTimeScale={activeRoadmap.timeScale}
              onTimeScaleChange={handleTimeScaleChange}
            />
          </aside>
          <main className="flex-grow h-full overflow-hidden flex flex-col">
            <CenterPanel
              selectedGroup={selectedGroupObject}
              tasksInGroup={tasksInSelectedGroup}
              editingTaskId={editingTaskId}
              onToggleComplete={handleToggleComplete}
              onNotesChange={handleNotesChange}
              onSelectForEditing={handleSelectForEditing}
              onDeleteTask={handleDeleteTask}
              onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
              onOpenTaskSuggestionModal={() => setIsTaskSuggestionModalOpen(true)}
            />
          </main>
        </div>

        <footer className="shrink-0">
          <ImportExportControls 
              activeRoadmap={activeRoadmap}
              onImportTasksToActiveRoadmap={handleImportTasksToActiveRoadmap}
              setErrorMessage={setGlobalError} 
          />
        </footer>
        
        <AddTaskModal 
          isOpen={isAddTaskModalOpen}
          onClose={() => setIsAddTaskModalOpen(false)}
          onAddTask={handleAddTask}
        />
        {selectedGroupObject && activeRoadmap && (
          <TaskSuggestionModal
            isOpen={isTaskSuggestionModalOpen}
            onClose={() => setIsTaskSuggestionModalOpen(false)}
            selectedGroup={selectedGroupObject}
            tasksInGroup={tasksInSelectedGroup}
            setGlobalError={setGlobalError}
          />
        )}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={appSettings}
          onSaveSettings={handleSaveSettings}
          setGlobalError={setGlobalError}
          directoryHandle={directoryHandle}
          setDirectoryHandle={setDirectoryHandle}
          currentRoadmapDataForMigrationEstimate={allRoadmapsData.roadmaps.reduce((acc,r) => acc + r.tasks.length, 0)}
        />
        {isAnalyticsModalOpen && selectedRoadmapForAnalytics && (
          <RoadmapAnalyticsModal
            isOpen={isAnalyticsModalOpen}
            onClose={() => setIsAnalyticsModalOpen(false)}
            roadmap={selectedRoadmapForAnalytics}
            stats={analyticsForSelectedRoadmap}
          />
        )}
      </div>
    );
  }
  return content;
};

export default App;