import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatConversation } from '@/types';

type ChatState = {
  conversations: Record<string, ChatConversation>;
  isLoading: boolean;

  // Actions
  addMessage: (projectId: string, message: ChatMessage) => void;
  getConversation: (projectId: string) => ChatMessage[];
  clearConversation: (projectId: string) => void;
  setLoading: (isLoading: boolean) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      isLoading: false,

      addMessage: (projectId, message) =>
        set((state) => {
          const existing = state.conversations[projectId] || { projectId, messages: [] };
          return {
            conversations: {
              ...state.conversations,
              [projectId]: {
                ...existing,
                messages: [...existing.messages, message],
              },
            },
          };
        }),

      getConversation: (projectId) => {
        const { conversations } = get();
        return conversations[projectId]?.messages || [];
      },

      clearConversation: (projectId) =>
        set((state) => {
          const { [projectId]: _, ...rest } = state.conversations;
          return { conversations: rest };
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'chat-storage',
    }
  )
);
