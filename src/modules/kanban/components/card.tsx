'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/core/db/schema';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CardProps {
  task: Task;
  isOverlay?: boolean;
}

export function Card({ task, isOverlay = false }: CardProps) {
  const sortable = useSortable({ id: task.id, disabled: isOverlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const openTaskModal = useUIStore((state) => state.openTaskModal);

  const style = isOverlay
    ? { cursor: 'grabbing' as const }
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    openTaskModal(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-400/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-400/30';
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={handleClick}
      className={cn(
        'rounded-xl border p-3 backdrop-blur-sm transition-all duration-200',
        isOverlay
          ? 'cursor-grabbing border-primary/40 bg-background/90 shadow-2xl scale-[1.02] rotate-[1.5deg] ring-2 ring-primary/20'
          : isDragging
            ? 'opacity-30 border-dashed border-primary/30 bg-background/30 shadow-none'
            : 'cursor-grab border-white/25 bg-background/70 shadow-[0_14px_25px_-24px_rgba(15,23,42,0.7)] dark:border-white/10 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background/85'
      )}
    >
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-medium text-sm text-card-foreground line-clamp-2">{task.title}</h3>

        {/* Description Preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateDescription(task.description)}
          </p>
        )}

        {/* Footer: Priority Badge and Assignee Avatar */}
        <div className="flex items-center justify-between pt-1">
          <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>

          {task.assigneeId && (
            <div className="flex items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                {task.assigneeId.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
