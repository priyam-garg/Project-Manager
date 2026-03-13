'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/core/db/schema';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CardProps {
  task: Task;
}

export function Card({ task }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const openTaskModal = useUIStore((state) => state.openTaskModal);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    openTaskModal(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer',
        'hover:shadow-md hover:border-primary/50 transition-all duration-200',
        isDragging && 'cursor-grabbing'
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
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {task.assigneeId.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
