'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRoadmap } from '@/modules/roadmap/hooks/use-roadmap';
import { PlanViewer } from '@/modules/roadmap/components/PlanViewer';
import { PlanEditor } from '@/modules/roadmap/components/PlanEditor';
import { EmptyPlanState } from '@/modules/roadmap/components/EmptyPlanState';
import { VersionHistory } from '@/modules/roadmap/components/VersionHistory';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { useProjectsStore } from '@/stores/projects-store';
import { AnimatedPage } from '@/components/layout/animated-page';
import type { ImplementationPlan, PlanSection } from '@/types';

export default function RoadmapPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { getCurrentProject } = useProjectsStore();
  const project = getCurrentProject();

  const {
    plan,
    sections,
    isLoading,
    error,
    history,
    isGenerating,
    regeneratingPhase,
    loadPlan,
    loadHistory,
    saveFull,
    updateSection,
    regeneratePhase,
    generateNew,
    uploadNew,
  } = useRoadmap(projectId);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [viewingVersion, setViewingVersion] = useState<ImplementationPlan | null>(null);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (plan) {
      loadHistory();
    }
  }, [plan, loadHistory]);

  // When viewing a historical version
  const displayPlan = viewingVersion || plan;
  const displaySections = viewingVersion
    ? (viewingVersion.sections as PlanSection[]) ?? []
    : sections;
  const isViewingOldVersion = viewingVersion && viewingVersion.id !== plan?.id;

  if (isLoading && !plan) {
    return (
      <AnimatedPage className="h-full">
        <div className="flex h-full items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AnimatedPage>
    );
  }

  // No plan exists — show empty state
  if (!plan && !isLoading) {
    return (
      <AnimatedPage className="h-full">
        <div className="p-6">
          <EmptyPlanState
            onGenerate={async () => {
              if (project) {
                await generateNew({
                  name: project.name,
                  description: project.description ?? undefined,
                  techStack: (project.techStack as string[]) ?? undefined,
                });
              }
            }}
            onUpload={async (content) => {
              await uploadNew(content);
            }}
            isGenerating={isGenerating}
          />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="h-full">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Implementation Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {displayPlan?.source === 'ai_generated' ? '🤖 AI Generated' : '📝 Manual'}
            {displayPlan && ` · Version ${displayPlan.version}`}
            {isViewingOldVersion && (
              <span className="ml-2 text-amber-500 font-medium">(viewing old version)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isViewingOldVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingVersion(null)}
            >
              ← Back to current
            </Button>
          )}

          {!isViewingOldVersion && (
            <>
              {mode === 'view' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMode('edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Full Plan
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMode('view')}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Mode
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isGenerating}
                onClick={async () => {
                  if (
                    project &&
                    confirm(
                      'This will regenerate the entire plan using AI. Your current plan will be saved as a previous version. Continue?'
                    )
                  ) {
                    await generateNew({
                      name: project.name,
                      description: project.description ?? undefined,
                      techStack: (project.techStack as string[]) ?? undefined,
                    });
                    setMode('view');
                  }
                }}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`}
                />
                {isGenerating ? 'Regenerating...' : 'Regenerate All'}
              </Button>
            </>
          )}

          {displayPlan && (
            <VersionHistory
              history={history}
              currentVersion={displayPlan.version}
              onSelectVersion={setViewingVersion}
            />
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Content */}
      {mode === 'edit' && !isViewingOldVersion && displayPlan ? (
        <PlanEditor
          content={displayPlan.content}
          onSave={async (content) => {
            await saveFull(content);
            setMode('view');
          }}
          isLoading={isLoading}
        />
      ) : (
        <PlanViewer
          sections={displaySections}
          regeneratingPhase={regeneratingPhase}
          onRegeneratePhase={regeneratePhase}
          onUpdateSection={updateSection}
        />
      )}
      </div>
    </AnimatedPage>
  );
}
