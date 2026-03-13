'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/core/db/schema';
import { useTasksStore } from '@/stores/tasks-store';
import { useUIStore } from '@/stores/ui-store';
import { useTasks } from '../hooks/use-tasks';
import { moveTask } from '../actions';
import { Column } from './column';
import { Card } from './card';
import { TaskModal } from './task-modal';
import { CreateTaskForm } from './create-task-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BoardProps {
  projectId: string;
}

const STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done'];

export function Board({ projectId }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('backlog');
  
  const { tasks, isLoading } = useTasks(projectId);
  const { optimisticMoveTask, revertOptimisticUpdate } = useTasksStore();
  const { sidebarOpen } = useUIStore();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start - store the task being dragged
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  // Handle drag end - update task status
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    
    // Determine the new status - could be a column ID or another task ID
    let newStatus: TaskStatus;
    
    // Check if we dropped on a column (status)
    if (STATUSES.includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      // We dropped on another task, find that task's status
      const targetTask = tasks.find((t) => t.id === over.id);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    // Find the task being moved
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Store original task for potential rollback
    const originalTask = { ...task };

    // Optimistic update
    optimisticMoveTask(taskId, newStatus);

    // Call server action
    try {
      const result = await moveTask(taskId, newStatus, projectId);
      if (!result.success) {
        // Revert on failure
        revertOptimisticUpdate(taskId, originalTask);
        toast.error(result.error || 'Failed to move task');
      } else {
        toast.success('Task moved successfully');
      }
    } catch (error) {
      // Revert on error
      revertOptimisticUpdate(taskId, originalTask);
      toast.error('Failed to move task');
      console.error('Error moving task:', error);
    }
  };

  // Group tasks by status
  const tasksByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  if (isLoading) {
    return (
      <section className={cn(
        "grid gap-4 p-6",
        sidebarOpen 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto"
      )}>
        {STATUSES.map((status) => (
          <div key={status} className="bg-muted/30 rounded-lg h-96 animate-pulse" />
        ))}
      </section>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <section className={cn(
        "grid gap-4 p-6",
        sidebarOpen 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto"
      )}>
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onAddTask={() => {
              setDefaultStatus(status);
              setIsCreateDialogOpen(true);
            }}
          />
        ))}
      </section>

      <DragOverlay>
        {activeTask ? <Card task={activeTask} /> : null}
      </DragOverlay>

      <TaskModal />

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <CreateTaskForm
            projectId={projectId}
            defaultStatus={defaultStatus}
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
