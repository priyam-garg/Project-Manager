'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTasksStore } from '@/stores/tasks-store';
import { mapTaskRow } from '@/lib/realtime/map-task-row';

export function useRealtimeTasks(projectId: string | null | undefined) {
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT': {
              const task = mapTaskRow(payload.new as Parameters<typeof mapTaskRow>[0]);
              addTask(task);
              break;
            }
            case 'UPDATE': {
              const task = mapTaskRow(payload.new as Parameters<typeof mapTaskRow>[0]);
              updateTask(task.id, task);
              break;
            }
            case 'DELETE': {
              const oldRow = payload.old as { id?: string };
              if (oldRow?.id) deleteTask(oldRow.id);
              break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, addTask, updateTask, deleteTask]);
}
