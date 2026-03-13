import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/core/db/schema';

type ProjectsState = {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (projectId: string) => void;
  getCurrentProject: () => Project | null;
  setLoading: (isLoading: boolean) => void;
};

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      isLoading: false,

      setProjects: (projects) => set({ projects }),

      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) || null;
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'projects-storage',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
