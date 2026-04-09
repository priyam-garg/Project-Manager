import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { loadChatHistory, sendChatMessage } from '../actions';

export function useChat(projectId: string) {
  const { getConversation, addMessage, setConversation, isLoading, setLoading } = useChatStore();
  const messages = getConversation(projectId);

  useEffect(() => {
    let isMounted = true;

    const hydrateConversation = async () => {
      setLoading(true);
      const result = await loadChatHistory(projectId);
      setLoading(false);

      if (!isMounted || !result.success || !result.data) return;
      setConversation(projectId, result.data);
    };

    hydrateConversation();

    return () => {
      isMounted = false;
    };
  }, [projectId, setConversation, setLoading]);

  const sendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(projectId, userMessage);

    // Send to API and get response
    setLoading(true);
    const result = await sendChatMessage(projectId, content);
    setLoading(false);

    if (result.data) {
      addMessage(projectId, result.data);
    }
  };

  return { messages, sendMessage, isLoading };
}
