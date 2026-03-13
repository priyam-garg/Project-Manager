import { useEffect } from 'react';
import { useProjectsStore } from '@/stores/projects-store';
import { getProjects } from '../actions';

export function useProjects() {
  const { projects, isLoading, setProjects, setLoading } = useProjectsStore();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const result = await getProjects();
      if (result.success && result.data) {
        setProjects(result.data);
      }
      setLoading(false);
    }

    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, setProjects, setLoading]);

  return { projects, isLoading };
}
