import { Task, TimeScale, TimeGroup } from '../types';

// Helper to get the week number for a date
const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  return weekNo;
};

const getDayKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

export const getFormattedDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00'); // Ensure parsing as local date
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export const groupTasks = (tasks: Task[], timeScale: TimeScale): TimeGroup[] => {
  if (!tasks || tasks.length === 0) return [];

  const groupsMap = new Map<string, TimeGroup>();

  // Determine the overall date range for generating all potential groups
  let minDate = new Date(tasks[0].startDate + 'T00:00:00');
  let maxDate = new Date(tasks[0].endDate + 'T00:00:00');

  tasks.forEach(task => {
    const taskStartDate = new Date(task.startDate + 'T00:00:00');
    const taskEndDate = new Date(task.endDate + 'T00:00:00');
    if (taskStartDate < minDate) minDate = taskStartDate;
    if (taskEndDate > maxDate) maxDate = taskEndDate;
  });
  
  // If no tasks, still provide a default range (e.g., this month)
  if (tasks.length === 0) {
    minDate = new Date();
    minDate.setDate(1);
    maxDate = new Date(minDate.getFullYear(), minDate.getMonth() + 1, 0);
  }


  let currentDate = new Date(minDate);
  currentDate.setHours(0,0,0,0); // Normalize to start of day

  while (currentDate <= maxDate) {
    let key: string;
    let label: string;
    let groupStartDate: Date;
    let groupEndDate: Date;

    switch (timeScale) {
      case TimeScale.Daily:
        key = getDayKey(currentDate);
        label = currentDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        groupStartDate = new Date(currentDate);
        groupEndDate = new Date(currentDate);
        groupEndDate.setHours(23,59,59,999);
        if (!groupsMap.has(key)) groupsMap.set(key, { key, label, startDate: groupStartDate, endDate: groupEndDate });
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case TimeScale.Weekly:
        key = getWeekKey(currentDate);
        const yearW = parseInt(key.substring(0,4));
        const weekW = parseInt(key.substring(6));
        
        const firstDayOfYear = new Date(yearW, 0, 1);
        // Calculate the start date of the week
        // The day of the week (0 for Sunday, 1 for Monday, etc.)
        const dayOfWeek = firstDayOfYear.getDay();
        // Adjust to ISO 8601 week start (Monday)
        const daysOffset = (dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek);
        groupStartDate = new Date(yearW, 0, (weekW - 1) * 7 + daysOffset);


        groupEndDate = new Date(groupStartDate);
        groupEndDate.setDate(groupStartDate.getDate() + 6);
        groupEndDate.setHours(23,59,59,999);

        label = `Week ${weekW}: ${groupStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${groupEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        if (!groupsMap.has(key)) groupsMap.set(key, { key, label, startDate: groupStartDate, endDate: groupEndDate });
        currentDate.setDate(currentDate.getDate() + 7); // Move to next week
        // Align current date to the start of the next week to avoid issues with DST or month changes
        currentDate = new Date(groupStartDate.getFullYear(), groupStartDate.getMonth(), groupStartDate.getDate()+7);
        currentDate.setHours(0,0,0,0);
        break;
      case TimeScale.Monthly:
        key = getMonthKey(currentDate);
        groupStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        groupEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        groupEndDate.setHours(23,59,59,999);
        label = groupStartDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        if (!groupsMap.has(key)) groupsMap.set(key, { key, label, startDate: groupStartDate, endDate: groupEndDate });
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1); // Ensure start of next month
        currentDate.setHours(0,0,0,0);
        break;
    }
  }
  
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return sortedGroups;
};


export const filterTasksForGroup = (tasks: Task[], group: TimeGroup): Task[] => {
  return tasks.filter(task => {
    const taskStartDate = new Date(task.startDate + 'T00:00:00');
    const taskEndDate = new Date(task.endDate + 'T00:00:00');
    // A task is in a group if ANY part of the task falls within the group's time range.
    // This means:
    // Task starts before or at group end AND Task ends after or at group start.
    return taskStartDate <= group.endDate && taskEndDate >= group.startDate;
  });
};