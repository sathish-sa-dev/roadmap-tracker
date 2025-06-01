import { Task } from '../types';

// Expected CSV header: name,startDate,endDate (notes and completed are optional)
// Dates should be YYYY-MM-DD
export const parseCSVToTasks = (csvString: string): Task[] => {
  const tasks: Task[] = [];
  const rows = csvString.trim().split('\n');
  
  if (rows.length <= 1) { // Header only or empty
    throw new Error("CSV file must contain a header row and at least one data row.");
  }

  const header = rows[0].split(',').map(h => h.trim().toLowerCase());
  const nameIndex = header.indexOf('name');
  const startDateIndex = header.indexOf('startdate');
  const endDateIndex = header.indexOf('enddate');

  if (nameIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
    throw new Error("CSV header must contain 'name', 'startDate', and 'endDate' columns.");
  }

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i].split(',');
    if (values.length < Math.max(nameIndex, startDateIndex, endDateIndex) + 1) {
      console.warn(`Skipping row ${i+1}: not enough columns.`);
      continue;
    }

    const name = values[nameIndex]?.trim();
    const startDate = values[startDateIndex]?.trim();
    const endDate = values[endDateIndex]?.trim();

    if (!name || !startDate || !endDate) {
      console.warn(`Skipping row ${i+1}: missing required fields (name, startDate, endDate).`);
      continue;
    }
    
    // Basic date validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      console.warn(`Skipping row ${i+1}: invalid date format for startDate ('${startDate}') or endDate ('${endDate}'). Expected YYYY-MM-DD.`);
      continue;
    }
    if (new Date(startDate) > new Date(endDate)) {
       console.warn(`Skipping row ${i+1}: startDate ('${startDate}') is after endDate ('${endDate}').`);
       continue;
    }


    tasks.push({
      id: crypto.randomUUID(),
      name,
      startDate,
      endDate,
      completed: false,
      notes: '',
    });
  }
  return tasks;
};