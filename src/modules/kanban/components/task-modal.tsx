'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useTasksStore } from '@/stores/tasks-store';
import { updateTask, deleteTask } from '@/modules/kanban/actions';
import type { Task, TaskStatus, TaskPriority } from '@/core/db/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, User, Calendar, Activity, Trash2, Save, Edit2, X } from 'lucide-react';

export function TaskModal() {
  const { taskModalOpen, selectedTaskId, closeTaskModal } = useUIStore();
  const { tasks, updateTask: updateTaskInStore, deleteTask: deleteTaskFromStore } = useTasksStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  // Find the selected task
  const task = tasks.find((t) => t.id === selectedTaskId);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setIsEditing(false);
    }
  }, [task]);

  // Mock task events for activity timeline
  const mockEvents = task
    ? [
        {
          id: '1',
          type: 'created',
          description: 'Task created',
          timestamp: task.createdAt,
          user: 'Alice Johnson',
        },
        {
          id: '2',
          type: 'status_changed',
          description: `Status changed to ${task.status}`,
          timestamp: task.updatedAt,
          user: 'Bob Smith',
        },
      ]
    : [];

  const handleSave = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      const result = await updateTask({
        id: task.id,
        projectId: task.projectId,
        title,
        description,
        status,
        priority,
      });

      if (result.success && result.data) {
        updateTaskInStore(task.id, result.data);
        toast.success('Task updated successfully');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update task');
      }
    } catch (error) {
      toast.error('An error occurred while updating the task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      const result = await deleteTask(task.id, task.projectId);

      if (result.success) {
        deleteTaskFromStore(task.id);
        toast.success('Task deleted successfully');
        closeTaskModal();
      } else {
        toast.error(result.error || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
    }
    setIsEditing(false);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  if (!task) return null;

  return (
    <Dialog open={taskModalOpen} onOpenChange={closeTaskModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </DialogTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            ) : (
              <p className="text-lg font-medium">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
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
              ) : (
                <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              {isEditing ? (
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriority)}
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
              ) : (
                <Badge variant={getPriorityColor(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          {/* Metadata */}
          {!isEditing && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
              {task.assigneeId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Assignee: {task.assigneeId}</span>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          {!isEditing && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 font-medium">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </div>
              <div className="space-y-3">
                {mockEvents.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.user} • {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={closeTaskModal}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
