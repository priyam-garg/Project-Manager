import { create } from 'zustand';
import type { Task, TaskStatus } from '@/core/db/schema';

type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Optimistic updates
  optimisticMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  revertOptimisticUpdate: (taskId: string, originalTask: Task) => void;

  // Reorder within column
  reorderTasks: (activeId: string, overId: string, status: TaskStatus) => void;
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks, error: null }),

  addTask: (task) =>
    set((state) => {
      if (state.tasks.some((t) => t.id === task.id)) {
        return { tasks: state.tasks, error: null };
      }
      return { tasks: [...state.tasks, task], error: null };
    }),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      error: null,
    })),

  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      error: null,
    })),

  moveTask: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t
      ),
      error: null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  optimisticMoveTask: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    })),

  revertOptimisticUpdate: (taskId, originalTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? originalTask : t)),
    })),

  reorderTasks: (activeId, overId, status) =>
    set((state) => {
      const allTasks = [...state.tasks];
      // Get tasks in this column in their current array order
      const columnTaskIds = allTasks
        .map((t, i) => ({ task: t, index: i }))
        .filter((item) => item.task.status === status);

      const activeEntry = columnTaskIds.find((item) => item.task.id === activeId);
      const overEntry = columnTaskIds.find((item) => item.task.id === overId);

      if (!activeEntry || !overEntry) return state;

      // Remove the active task from its current position
      allTasks.splice(activeEntry.index, 1);

      // Find the new position of the over task (index may have shifted after removal)
      const newOverIndex = allTasks.findIndex((t) => t.id === overId);
      if (newOverIndex === -1) return state;

      // Insert the active task at the over task's position
      allTasks.splice(newOverIndex, 0, activeEntry.task);

      return { tasks: allTasks };
    }),
}));
