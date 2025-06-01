export interface Task {
  id: string;
  name: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  completed: boolean;
  notes: string; // HTML content from rich-text editor
  category?: string; 
}

export enum TimeScale {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export interface TimeGroup {
  key: string; // Unique key, e.g., '2024-07-15', '2024-W29', '2024-07'
  label: string; // Display label, e.g., "July 15, 2024", "Week 29: Jul 15 - Jul 21", "July 2024"
  startDate: Date;
  endDate: Date;
}

export interface Roadmap {
  id: string;
  name: string;
  tasks: Task[];
  timeScale: TimeScale;
  // lastOpened?: string; // Future: for sorting roadmaps by recently opened
}

export interface PomodoroSession {
  id: string;
  roadmapId: string;
  taskId: string;
  taskName: string; // Denormalized for easier display in analytics
  taskCategory?: string; // Denormalized
  startTime: string; // ISO string
  endTime: string; // ISO string
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  sessionType: 'work' | 'break';
  completed: boolean; // True if session ran its full planned duration
}

export interface AllRoadmapsData {
  roadmaps: Roadmap[];
  pomodoroSessions: PomodoroSession[]; 
  activePomodoroTaskDetails: { // Details of task currently selected for Pomodoro
    roadmapId: string;
    taskId: string;
    taskName: string;
    taskCategory?: string;
  } | null;
}


export enum StorageLocation {
  LocalStorage = 'localStorage',
  FileSystem = 'fileSystem',
}

export interface AppSettings {
  storageLocation: StorageLocation;
  directoryName: string | null; // Name of the chosen directory if fileSystem is used
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
}

export interface CalculatedTaskStats {
  totalTasks: number;
  completedTasks: number;
  completedPercentage: number;
  inProgressTasks: number;
  inProgressPercentage: number;
  overdueTasks: number;
  overduePercentage: number;
}