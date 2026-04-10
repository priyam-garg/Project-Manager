import { db } from '@/core/db/client';
import { tasks } from '@/core/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { generateChatCompletion } from '@/core/ai/chat';

const SYSTEM_PROMPT = `You are an assistant that links Git commits to project tasks.
You will be given a commit message, the list of files it changed, and a list of OPEN tasks (each with id, title, description).
Your job: decide which tasks (if any) this commit completes.

Rules:
- A commit completes a task only if the change clearly delivers what the task asks for.
- If unsure, do NOT include the task.
- Respond with ONLY valid JSON in this exact shape: {"taskIds": ["id1", "id2"]}
- Return an empty array if no task is completed.
- Do NOT wrap in markdown. Do NOT add commentary.`;

export type CommitMatchInput = {
  projectId: string;
  commitMessage: string;
  filesChanged: string[];
};

export async function matchCommitToTasks(
  input: CommitMatchInput
): Promise<string[]> {
  // Load open tasks (status != done)
  const openTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, input.projectId), ne(tasks.status, 'done')));

  if (openTasks.length === 0) return [];

  const taskList = openTasks
    .map(
      (t) =>
        `- id: ${t.id}\n  title: ${t.title}${t.description ? `\n  description: ${t.description.slice(0, 300)}` : ''}`
    )
    .join('\n');

  const filesPreview = input.filesChanged.slice(0, 20).join('\n');

  const userMessage = `Commit message:
${input.commitMessage}

Files changed (${input.filesChanged.length}):
${filesPreview}

Open tasks:
${taskList}

Which tasks does this commit complete? Respond with JSON only.`;

  let completion;
  try {
    completion = await generateChatCompletion({
      message: userMessage,
      history: [],
      systemPrompt: SYSTEM_PROMPT,
    });
  } catch (err) {
    console.warn('[commit-matcher] LLM call failed:', err);
    return [];
  }

  // Extract JSON
  const text = completion.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { taskIds?: unknown };
    if (!Array.isArray(parsed.taskIds)) return [];
    const validIds = new Set(openTasks.map((t) => t.id));
    return parsed.taskIds.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id)
    );
  } catch {
    return [];
  }
}
