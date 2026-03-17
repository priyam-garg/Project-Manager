'use server';

import type { ChatMessage, ApiResponse } from '@/types';
import { getAuthUser } from '@/core/auth';
import {
  getChatMessages as dbGetChatMessages,
  saveChatMessage,
  clearChatHistory as dbClearChatHistory,
} from '@/core/db/queries';
import { generateMockChatResponse } from '@/lib/mock-data';

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

    // Save user message to DB
    const userMsg = await saveChatMessage({
      projectId,
      userId: user.id,
      role: 'user',
      content: message,
    });

    // Generate AI response (still mock — AI integration is a separate feature)
    const mockResponse = generateMockChatResponse(message);

    // Save AI response to DB
    const assistantMsg = await saveChatMessage({
      projectId,
      userId: null,
      role: 'assistant',
      content: mockResponse.content,
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
    return { success: false, error: 'Failed to send message' };
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
