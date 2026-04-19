'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/modules/projects/hooks/use-projects';
import { useProjectsStore } from '@/stores/projects-store';
import { AnimatedCard, AnimatedPage } from '@/components/layout/animated-page';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FolderKanban, Calendar, Sparkles } from 'lucide-react';
import { CreateProjectDialog } from '@/modules/projects/components/create-project-dialog';

export default function ProjectsDashboardPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjects();
  const { setCurrentProject } = useProjectsStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Auto-select project if only one exists (without redirecting away from dashboard)
  useEffect(() => {
    if (!isLoading && projects.length === 1) {
      setCurrentProject(projects[0].id);
    }
  }, [projects, isLoading, setCurrentProject]);

  if (isLoading) {
    return (
      <AnimatedPage className="h-full">
        <div className="h-full overflow-y-auto soft-scrollbar">
          <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="h-full">
      <div className="h-full overflow-y-auto soft-scrollbar">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Workspace Overview
            </p>
            <h1 className="text-3xl font-bold text-gradient">Projects</h1>
            <p className="text-muted-foreground">Manage and organize your active workspaces</p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <AnimatedCard key={project.id} delay={index * 0.05}>
                <Card
                  className="group cursor-pointer p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35"
                  onClick={() => {
                    setCurrentProject(project.id);
                    router.push(`/projects/${project.id}/board`);
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl bg-primary/12 p-3 text-primary transition-colors group-hover:bg-primary/20">
                        <FolderKanban className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <FolderKanban className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Get started by creating your first project to organize your tasks and collaborate with your team.
                </p>
              </div>
              <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </AnimatedPage>
  );
}
