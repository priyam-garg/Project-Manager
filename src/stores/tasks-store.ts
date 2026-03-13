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
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks, error: null }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
      error: null,
    })),

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
}));
