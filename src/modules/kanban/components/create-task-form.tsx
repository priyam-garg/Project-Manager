'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasksStore } from '@/stores/tasks-store';
import { createTask } from '@/modules/kanban/actions';
import type { TaskStatus, TaskPriority } from '@/core/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

// Validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  assigneeId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateTaskFormProps {
  projectId: string;
  defaultStatus?: TaskStatus;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateTaskForm({
  projectId,
  defaultStatus = 'backlog',
  onSuccess,
  onCancel,
}: CreateTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addTask } = useTasksStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      assigneeId: '',
    },
  });

  const status = watch('status');
  const priority = watch('priority');

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createTask({
        projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
      });

      if (result.success && result.data) {
        addTask(result.data);
        toast.success('Task created successfully');
        reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create task');
      }
    } catch (error) {
      toast.error('An error occurred while creating the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register('title')}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description (optional)"
          rows={4}
          {...register('description')}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as TaskStatus)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">
            Priority <span className="text-destructive">*</span>
          </Label>
          <Select
            value={priority}
            onValueChange={(value) => setValue('priority', value as TaskPriority)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Assignee (optional) */}
      <div className="space-y-2">
        <Label htmlFor="assigneeId">Assignee (Optional)</Label>
        <Input
          id="assigneeId"
          placeholder="Enter assignee ID"
          {...register('assigneeId')}
          disabled={isSubmitting}
        />
        {errors.assigneeId && (
          <p className="text-sm text-destructive">{errors.assigneeId.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
