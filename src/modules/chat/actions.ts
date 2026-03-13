'use server';

import type { ChatMessage, ApiResponse } from '@/types';
import { generateMockChatResponse, simulateDelay } from '@/lib/mock-data';

export async function sendChatMessage(
  projectId: string,
  message: string
): Promise<ApiResponse<ChatMessage>> {
  await simulateDelay(500, 1500);

  try {
    const response = generateMockChatResponse(message);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: 'Failed to send message' };
  }
}
