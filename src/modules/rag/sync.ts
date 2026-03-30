import { getQdrantClient, ensureCollection, COLLECTION_NAME } from './qdrant';
import {
  generateEmbedding,
  buildTaskEmbeddingText,
} from '@/core/ai/embedding';
import type { Task } from '@/core/db/schema';

export async function upsertTaskVector(task: Task): Promise<void> {
  await ensureCollection();
  const client = getQdrantClient();

  const text = buildTaskEmbeddingText({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    tags: (task.tags as string[]) ?? [],
  });

  const vector = await generateEmbedding(text);

  await client.upsert(COLLECTION_NAME, {
    points: [
      {
        id: task.id,
        vector,
        payload: {
          project_id: task.projectId,
          task_id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          tags: (task.tags as string[]) ?? [],
          text,
        },
      },
    ],
  });
}

export async function deleteTaskVector(taskId: string): Promise<void> {
  const client = getQdrantClient();
  await client.delete(COLLECTION_NAME, {
    points: [taskId],
  });
}
