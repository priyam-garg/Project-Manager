'use server';

import type { ChatMessage, ApiResponse } from '@/types';
import { getAuthUser } from '@/core/auth';
import {
  getChatMessages as dbGetChatMessages,
  saveChatMessage,
  clearChatHistory as dbClearChatHistory,
  consumeChatRateLimit,
} from '@/core/db/queries';
import { generateChatCompletion } from '@/core/ai/chat';

const RATE_LIMIT_PER_WINDOW = Number(process.env.CHAT_RATE_LIMIT_REQUESTS || 20);
const RATE_LIMIT_WINDOW_MINUTES = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MINUTES || 1);

function toClientError(error: unknown): string {
  if (!(error instanceof Error)) return 'Failed to send message';
  if (error.message.includes('Rate limit exceeded')) {
    return 'Rate limit exceeded. Please wait and try again.';
  }
  if (error.message.toLowerCase().includes('timeout')) {
    return 'The AI service timed out. Please try again.';
  }
  return 'Failed to send message';
}

/**
 * Send a user message and get an AI response.
 * User message and AI response are both persisted to the database.
 * AI response is still mock for now (AI integration is a separate feature).
 */
export async function sendChatMessage(
  projectId: string,
  message: string
): Promise<ApiResponse<ChatMessage>> {
  try {
    const user = await getAuthUser();

    const rateLimit = await consumeChatRateLimit({
      userId: user.id,
      projectId,
      limit: RATE_LIMIT_PER_WINDOW,
      windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded');
    }

    const history = await dbGetChatMessages(projectId);
    const historyForModel = history
      .filter((msg) => msg.id)
      .slice(-20)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    // Save user message to DB
    await saveChatMessage({
      projectId,
      userId: user.id,
      role: 'user',
      content: message,
    });

    let completion;
    try {
      completion = await generateChatCompletion({
        message,
        history: historyForModel,
      });
    } catch (error) {
      const fallback = 'I could not generate a response right now. Please try again in a moment.';
      const assistantErrorMsg = await saveChatMessage({
        projectId,
        userId: null,
        role: 'assistant',
        content: fallback,
        metrics: {
          provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
          model: process.env.OPENAI_CHAT_MODEL || 'unknown',
          prompt: message,
          response: fallback,
          latencyMs: 0,
          retryCount: Number(process.env.AI_MAX_RETRIES || 2),
          errorStatus: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        },
      });

      return {
        success: false,
        error: toClientError(error),
        data: {
          id: assistantErrorMsg.id,
          role: 'assistant',
          content: assistantErrorMsg.content,
          timestamp: assistantErrorMsg.createdAt,
        },
      };
    }

    // Save AI response and telemetry to DB
    const assistantMsg = await saveChatMessage({
      projectId,
      userId: null,
      role: 'assistant',
      content: completion.content,
      metrics: {
        provider: completion.provider,
        model: completion.model,
        prompt: message,
        response: completion.content,
        latencyMs: completion.latencyMs,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        totalTokens: completion.totalTokens,
        retryCount: completion.retryCount,
        errorStatus: false,
      },
    });

    console.info('chat_completion', {
      projectId,
      userId: user.id,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
      totalTokens: completion.totalTokens,
      retryCount: completion.retryCount,
    });

    return {
      success: true,
      data: {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        timestamp: assistantMsg.createdAt,
      },
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, error: toClientError(error) };
  }
}

/**
 * Load chat history for a project from the database.
 */
export async function loadChatHistory(
  projectId: string
): Promise<ApiResponse<ChatMessage[]>> {
  try {
    await getAuthUser();
    const messages = await dbGetChatMessages(projectId);

    const chatMessages: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));

    return { success: true, data: chatMessages };
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return { success: false, error: 'Failed to load chat history' };
  }
}

/**
 * Clear all chat history for a project.
 */
export async function clearChat(projectId: string): Promise<ApiResponse<void>> {
  try {
    await getAuthUser();
    await dbClearChatHistory(projectId);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear chat:', error);
    return { success: false, error: 'Failed to clear chat' };
  }
}
