import { and, asc, eq, lt, sql } from 'drizzle-orm';
import { db } from '../client';
import { chatMessages, chatMessageMetrics, chatRateLimits } from '../schema';
import type { ChatMessageRecord, ChatRole } from '../schema';

function generateId(): string {
  return crypto.randomUUID();
}

export type ChatMessageMetricsInput = {
  provider: string;
  model: string;
  prompt: string;
  response: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  retryCount: number;
  errorStatus: boolean;
  errorMessage?: string;
};

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
  metrics?: ChatMessageMetricsInput;
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

  if (data.metrics) {
    await db.insert(chatMessageMetrics).values({
      messageId: message.id,
      provider: data.metrics.provider,
      model: data.metrics.model,
      prompt: data.metrics.prompt,
      response: data.metrics.response,
      latencyMs: data.metrics.latencyMs,
      promptTokens: data.metrics.promptTokens ?? null,
      completionTokens: data.metrics.completionTokens ?? null,
      totalTokens: data.metrics.totalTokens ?? null,
      retryCount: data.metrics.retryCount,
      errorStatus: data.metrics.errorStatus,
      errorMessage: data.metrics.errorMessage ?? null,
      createdAt: new Date(),
    });
  }

  return message;
}

/**
 * Delete all chat messages for a project.
 */
export async function clearChatHistory(projectId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.projectId, projectId));
}

export async function consumeChatRateLimit(params: {
  userId: string;
  projectId: string;
  limit: number;
  windowMinutes: number;
}): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setSeconds(0, 0);
  windowStart.setMinutes(now.getMinutes() - (now.getMinutes() % params.windowMinutes));
  const windowKey = windowStart.toISOString();

  const [rateWindow] = await db
    .insert(chatRateLimits)
    .values({
      userId: params.userId,
      projectId: params.projectId,
      windowKey,
      requestCount: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [chatRateLimits.userId, chatRateLimits.projectId, chatRateLimits.windowKey],
      set: {
        requestCount: sql`${chatRateLimits.requestCount} + 1`,
        updatedAt: now,
      },
    })
    .returning({ requestCount: chatRateLimits.requestCount });

  const count = Number(rateWindow?.requestCount ?? 0);
  const allowed = count <= params.limit;

  const staleBefore = new Date(windowStart.getTime() - params.windowMinutes * 2 * 60 * 1000);
  await db
    .delete(chatRateLimits)
    .where(
      and(
        eq(chatRateLimits.userId, params.userId),
        eq(chatRateLimits.projectId, params.projectId),
        lt(chatRateLimits.windowKey, staleBefore.toISOString())
      )
    );

  return {
    allowed,
    remaining: Math.max(0, params.limit - count),
  };
}
