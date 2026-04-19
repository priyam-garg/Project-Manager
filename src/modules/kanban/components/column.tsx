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
    <article className="glass-card flex h-full flex-col overflow-hidden">
      {/* Column Header — pinned */}
      <header className="shrink-0 border-b border-white/25 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {statusLabels[status]}
          </h2>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/12 px-2 text-xs font-medium text-primary">
            {tasks.length}
          </span>
        </div>
        </div>
      </header>

      {/* Droppable Area — scrollable */}
      <div
        ref={setNodeRef}
        className={cn(
          'soft-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => <Card key={task.id} task={task} />)
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/30 bg-background/35 py-10 text-center dark:border-white/10">
              <p className="text-sm font-medium text-foreground">No tasks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drag tasks here or add a new one
              </p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add Task Button — pinned */}
      <footer className="shrink-0 border-t border-white/25 p-3 dark:border-white/10">
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
