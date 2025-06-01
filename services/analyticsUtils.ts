import { Roadmap, Task, CalculatedTaskStats } from '../types.ts';
import { formatDateToYYYYMMDD } from './dateUtils.ts';

export const calculateRoadmapTaskStats = (roadmap: Roadmap): CalculatedTaskStats => {
  const totalTasks = roadmap.tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      completedPercentage: 0,
      inProgressTasks: 0,
      inProgressPercentage: 0,
      overdueTasks: 0,
      overduePercentage: 0,
    };
  }

  const todayYYYYMMDD = formatDateToYYYYMMDD(new Date());
  let completedTasks = 0;
  let overdueTasks = 0;
  let inProgressTasks = 0;

  roadmap.tasks.forEach(task => {
    if (task.completed) {
      completedTasks++;
    } else {
      // Not completed, check if overdue or in progress
      if (task.endDate < todayYYYYMMDD) {
        overdueTasks++;
      } else {
        inProgressTasks++;
      }
    }
  });

  return {
    totalTasks,
    completedTasks,
    completedPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    inProgressTasks,
    inProgressPercentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0,
    overdueTasks,
    overduePercentage: totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0,
  };
};