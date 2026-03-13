import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

type UIState = {
  theme: ThemeMode;
  sidebarOpen: boolean;
  taskModalOpen: boolean;
  selectedTaskId: string | null;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      taskModalOpen: false,
      selectedTaskId: null,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      openTaskModal: (taskId) =>
        set({
          taskModalOpen: true,
          selectedTaskId: taskId,
        }),

      closeTaskModal: () =>
        set({
          taskModalOpen: false,
          selectedTaskId: null,
        }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
