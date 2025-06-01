export const LOCAL_STORAGE_KEY = 'roadmapTrackerData'; // Stores AllRoadmapsData
export const APP_SETTINGS_KEY = 'roadmapAppSettings';

// Default Pomodoro durations in minutes
export const DEFAULT_POMODORO_WORK_MINUTES = 25;
export const DEFAULT_POMODORO_BREAK_MINUTES = 5;

// These will be derived from AppSettings, constants are fallback.
// Kept for potential direct use in PomodoroTimer if settings not passed or for initial state.
export const POMODORO_WORK_DURATION = DEFAULT_POMODORO_WORK_MINUTES * 60; // 25 minutes in seconds
export const POMODORO_BREAK_DURATION = DEFAULT_POMODORO_BREAK_MINUTES * 60;  // 5 minutes in seconds
