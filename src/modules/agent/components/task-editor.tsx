'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { GeneratedTask, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TaskEditorProps {
  task: GeneratedTask;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChange: (task: GeneratedTask) => void;
}

export function TaskEditor({ task, isSelected, onToggleSelect, onChange }: TaskEditorProps) {
  const [localTask, setLocalTask] = useState(task);

  const handleChange = <K extends keyof GeneratedTask>(field: K, value: GeneratedTask[K]) => {
    const updated = { ...localTask, [field]: value };
    setLocalTask(updated);
    onChange(updated);
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    high: 'bg-red-500/10 text-red-700 dark:text-red-400',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />

        {/* Task Content */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor={`title-${task.title}`} className="text-xs">
              Title
            </Label>
            <Input
              id={`title-${task.title}`}
              value={localTask.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="font-medium"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor={`desc-${task.title}`} className="text-xs">
              Description
            </Label>
            <Textarea
              id={`desc-${task.title}`}
              value={localTask.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Priority and Estimated Hours */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`priority-${task.title}`} className="text-xs">
                Priority
              </Label>
              <Select
                value={localTask.priority}
                onValueChange={(value) => handleChange('priority', value as TaskPriority)}
              >
                <SelectTrigger id={`priority-${task.title}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="outline" className={priorityColors.low}>
                      Low
                    </Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant="outline" className={priorityColors.medium}>
                      Medium
                    </Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge variant="outline" className={priorityColors.high}>
                      High
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {localTask.estimatedHours && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{localTask.estimatedHours}h</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
