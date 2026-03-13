import { useEffect } from 'react';
import { useTasksStore } from '@/stores/tasks-store';
import { getTasks } from '../actions';

export function useTasks(projectId: string) {
  const { tasks, isLoading, setTasks, setLoading, setError } = useTasksStore();

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const result = await getTasks(projectId);
      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        setError(result.error || 'Failed to fetch tasks');
      }
      setLoading(false);
    }

    fetchTasks();
  }, [projectId, setTasks, setLoading, setError]);

  return { tasks, isLoading };
}
