import { useChatStore } from '@/stores/chat-store';
import { sendChatMessage } from '../actions';
import { generateId } from '@/lib/mock-data';

export function useChat(projectId: string) {
  const { getConversation, addMessage, isLoading, setLoading } = useChatStore();
  const messages = getConversation(projectId);

  const sendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(projectId, userMessage);

    // Send to API and get response
    setLoading(true);
    const result = await sendChatMessage(projectId, content);
    setLoading(false);

    if (result.success && result.data) {
      addMessage(projectId, result.data);
    }
  };

  return { messages, sendMessage, isLoading };
}
