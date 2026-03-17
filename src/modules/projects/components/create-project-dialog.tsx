'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsStore } from '@/stores/projects-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject } from '@/modules/projects/actions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { setProjects, projects, setCurrentProject } = useProjectsStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.success && result.data) {
        // Add the new project to the store
        setProjects([...projects, result.data]);
        setCurrentProject(result.data.id);

        // Reset form and close dialog
        setName('');
        setDescription('');
        onOpenChange(false);

        // Navigate to the new project's board
        router.push(`/projects/${result.data.id}/board`);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your tasks and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="project-description"
              placeholder="Brief description of the project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
