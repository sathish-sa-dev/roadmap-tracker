import { AllRoadmapsData, Roadmap } from '../types'; // Added Roadmap for type checking during migration

// Type declarations for File System Access API are moved to global.d.ts

// Helper to verify and request permission for a directory handle
export async function verifyDirectoryPermission(directoryHandle: FileSystemDirectoryHandle, readWrite: boolean = true): Promise<boolean> {
  try {
    const options: FileSystemHandlePermissionDescriptor = readWrite ? { mode: 'readwrite' } : { mode: 'read' };
    if ((await directoryHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await directoryHandle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying directory permission:', error);
    return false;
  }
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!window.showDirectoryPicker) {
      throw new Error('File System Access API is not supported in this browser');
    }
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    return handle;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('User cancelled directory picker.');
    } else {
      console.error('Error picking directory:', error);
    }
    return null;
  }
}

async function readFileFromDirectory(directoryHandle: FileSystemDirectoryHandle, fileName: string): Promise<string | null> {
  try {
    if (!(await verifyDirectoryPermission(directoryHandle, false))) { 
      throw new Error('Read permission for the directory was not granted.');
    }
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text || text.trim() === '') {
      console.log(`File "${fileName}" is empty.`);
      return null;
    }
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log(`File "${fileName}" not found in directory.`);
    } else {
      console.error(`Error reading file "${fileName}":`, error);
    }
    return null;
  }
}

async function writeFileToDirectory(directoryHandle: FileSystemDirectoryHandle, fileName: string, content: string): Promise<boolean> {
  try {
    if (!(await verifyDirectoryPermission(directoryHandle, true))) { 
      throw new Error('Read/Write permission for the directory was not granted.');
    }
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    console.log(`Successfully wrote file "${fileName}"`);
    return true;
  } catch (error) {
    console.error(`Error writing file "${fileName}":`, error);
    return false;
  }
}

export async function loadAllRoadmapsDataFromHandle(directoryHandle: FileSystemDirectoryHandle | null): Promise<AllRoadmapsData | null> {
  if (!directoryHandle) return null;
  
  try {
    const jsonString = await readFileFromDirectory(directoryHandle, 'roadmap-data.json');
    if (!jsonString) {
      console.log('No roadmap-data.json file found or file is empty');
      return null;
    }

    const data = JSON.parse(jsonString);
    
    // Initialize with defaults for new fields
    const defaultNewFields = {
      pomodoroSessions: [],
      activePomodoroTaskDetails: null,
    };

    // Check for new format first (AllRoadmapsData)
    if (data && Array.isArray(data.roadmaps)) {
      console.log(`Loaded ${data.roadmaps.length} roadmaps from file system`);
      return {
        roadmaps: data.roadmaps as Roadmap[],
        pomodoroSessions: data.pomodoroSessions || defaultNewFields.pomodoroSessions,
        activePomodoroTaskDetails: data.activePomodoroTaskDetails || defaultNewFields.activePomodoroTaskDetails,
      } as AllRoadmapsData;
    }
    
    // Try parsing as old format (RoadmapData: {tasks, timeScale}) for migration
    if (data && Array.isArray(data.tasks) && data.timeScale) {
      console.log("Old data format detected in file, migrating to new multi-roadmap structure.");
      return {
        roadmaps: [{
          id: crypto.randomUUID(),
          name: "My Default Roadmap",
          tasks: data.tasks,
          timeScale: data.timeScale,
        }],
        ...defaultNewFields // Add new fields during migration
      };
    }
    
    console.error('Invalid data structure in roadmap-data.json:', data);
    return null;
  } catch (e) {
    console.error('Error loading data from file system:', e);
    return null;
  }
}

export async function saveAllRoadmapsDataToHandle(directoryHandle: FileSystemDirectoryHandle | null, data: AllRoadmapsData): Promise<boolean> {
  if (!directoryHandle) {
    console.error('No directory handle provided for saving');
    return false;
  }
  
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const success = await writeFileToDirectory(directoryHandle, 'roadmap-data.json', jsonString);
    if (success) {
      console.log(`Saved ${data.roadmaps.length} roadmaps to file system`);
    }
    return success;
  } catch (error) {
    console.error('Error saving data to file system:', error);
    return false;
  }
}