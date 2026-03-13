'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/core/db/schema';
import { Card } from './card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask?: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function Column({ status, tasks, onAddTask }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <article className="flex flex-col bg-muted/30 rounded-lg min-h-[500px]">
      {/* Column Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-foreground">
            {statusLabels[status]}
          </h2>
          <span className="flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </header>

      {/* Droppable Area with Sortable Context */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-2 overflow-y-auto',
          'min-h-[200px]'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => <Card key={task.id} task={task} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag tasks here or add a new one
              </p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <footer className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddTask}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </footer>
    </article>
  );
}
