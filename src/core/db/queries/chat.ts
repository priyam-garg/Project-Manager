import { eq, asc } from 'drizzle-orm';
import { db } from '../client';
import { chatMessages } from '../schema';
import type { ChatMessageRecord, ChatRole } from '../schema';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get all chat messages for a project, ordered chronologically.
 */
export async function getChatMessages(projectId: string): Promise<ChatMessageRecord[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.projectId, projectId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * Save a single chat message.
 */
export async function saveChatMessage(data: {
  projectId: string;
  userId: string | null;
  role: ChatRole;
  content: string;
}): Promise<ChatMessageRecord> {
  const [message] = await db
    .insert(chatMessages)
    .values({
      id: generateId(),
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      content: data.content,
    })
    .returning();

  return message;
}

/**
 * Delete all chat messages for a project.
 */
export async function clearChatHistory(projectId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.projectId, projectId));
}
