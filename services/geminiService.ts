import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TimeGroup, Task } from '../types.ts';
import { formatDateToYYYYMMDD } from './dateUtils.ts';

export interface PrioritizedTaskSuggestion {
  suggestedTaskId: string;
  taskName: string;
  reason: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchNextTaskSuggestion = async (
  timeGroup: TimeGroup,
  tasks: Task[]
): Promise<PrioritizedTaskSuggestion | null> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable. Cannot fetch suggestion.");
  }

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const modelName = 'gemini-2.5-flash-preview-04-17'; // Corrected variable name for clarity
  const groupStartDateStr = formatDateToYYYYMMDD(timeGroup.startDate);
  const groupEndDateStr = formatDateToYYYYMMDD(timeGroup.endDate);

  const tasksForPrompt = tasks.map(t => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    notes: t.notes ? t.notes.replace(/<[^>]*>?/gm, ' ').substring(0, 150) : ''
  }));

  const prompt = `You are an intelligent task prioritization assistant for a roadmap planning application.
The user is currently looking at the time block: '${timeGroup.label}' (from ${groupStartDateStr} to ${groupEndDateStr}).
Here is a list of their current tasks within this time block:
${JSON.stringify(tasksForPrompt)}

Please analyze these tasks and suggest which *one* task the user should focus on next.
Consider the following factors for prioritization:
1. Urgency: Tasks with earlier end dates, or tasks whose notes/name contain keywords like "urgent", "critical", "blocker", "important", "ASAP", "deadline".
2. Task Completion: Prefer uncompleted tasks. (All tasks provided are assumed to be from a general list, check their 'completed' status if available - note: 'completed' status not explicitly passed in this version of tasksForPrompt, assume all are actionable for now unless notes say otherwise)
3. Context: If a task seems like a prerequisite or foundational for others (based on name/notes), it might be more important.

Return your suggestion as a single JSON object with the following structure:
{
  "suggestedTaskId": "the_id_of_the_chosen_task_from_the_input_list",
  "taskName": "the_name_of_the_chosen_task",
  "reason": "a concise explanation (max 30 words) of why you are recommending this task. Be specific about the factors you considered."
}
Ensure 'suggestedTaskId' matches one of the IDs from the provided list.
If there is only one task in the list, suggest that task with a simple reason.
Do not suggest tasks that are already completed if that information were available. For now, pick the most relevant task.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // As per guidelines, ensure responseMimeType is set if you expect JSON
      // However, the prompt explicitly asks for a JSON object structure in the text.
      // If this causes issues, setting config: { responseMimeType: "application/json" } 
      // might be an option, but then parsing `response.text` needs to handle ```json ``` fences.
      // For now, keeping it simple as the prompt expects a JSON string in the text.
    });

    const textContent = response.text; // Correct way to access the text
    let jsonStr = textContent.trim();

    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);

    if (
      parsedData &&
      typeof parsedData.suggestedTaskId === 'string' &&
      typeof parsedData.taskName === 'string' &&
      typeof parsedData.reason === 'string'
    ) {
      const exists = tasks.some(task => task.id === parsedData.suggestedTaskId);
      if (exists) {
        return parsedData as PrioritizedTaskSuggestion;
      } else {
        console.error("AI suggested a task ID that doesn't exist in the provided list.", parsedData.suggestedTaskId);
        throw new Error("AI suggested an invalid task ID.");
      }
    } else {
      throw new Error("API response is not in the expected format for a prioritized task.");
    }

  } catch (error) {
    console.error("Error fetching next task suggestion from Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching suggestion.";
    if (errorMessage.toLowerCase().includes("api key")) {
      throw new Error("Invalid Gemini API Key. Please check your configuration or ensure the key is set in the environment.");
    }
    // Use string concatenation for safer error message construction
    throw new Error('Failed to get next task suggestion: ' + errorMessage);
  }
};