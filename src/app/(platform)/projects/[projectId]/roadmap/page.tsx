'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRoadmap } from '@/modules/roadmap/hooks/use-roadmap';
import { PlanViewer } from '@/modules/roadmap/components/PlanViewer';
import { PlanEditor } from '@/modules/roadmap/components/PlanEditor';
import { EmptyPlanState } from '@/modules/roadmap/components/EmptyPlanState';
import { VersionHistory } from '@/modules/roadmap/components/VersionHistory';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, RefreshCw, Loader2, Send, Sparkles, Bot, X } from 'lucide-react';
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
    isRefining,
    regeneratingPhase,
    loadPlan,
    loadHistory,
    saveFull,
    updateSection,
    regeneratePhase,
    generateNew,
    uploadNew,
    refinePlan,
  } = useRoadmap(projectId);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [viewingVersion, setViewingVersion] = useState<ImplementationPlan | null>(null);
  const [showRegenPrompt, setShowRegenPrompt] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');

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
            onGenerate={async (userPrompt?: string) => {
              if (project) {
                await generateNew({
                  name: project.name,
                  description: project.description ?? undefined,
                  techStack: (project.techStack as string[]) ?? undefined,
                  userPrompt,
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
            {displayPlan?.source === 'ai_generated'
              ? '🤖 AI Generated'
              : displayPlan?.source === 'ai_refined'
                ? '✨ AI Refined'
                : '📝 Manual'}
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
                  Edit Manually
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
                disabled={isGenerating || isRefining}
                onClick={() => {
                  setShowRegenPrompt(!showRegenPrompt);
                  setMode('view');
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate All
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

      {/* Regenerate Prompt Panel — appears when Regenerate All is clicked */}
      {showRegenPrompt && !isViewingOldVersion && (
        <div className="glass-card p-5 space-y-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/12 p-1.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Regenerate Plan</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRegenPrompt(false);
                setRegenPrompt('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Provide instructions for the AI, or regenerate without any specific prompt.
            Your current plan will be saved as a previous version.
          </p>

          <textarea
            value={regenPrompt}
            onChange={(e) => setRegenPrompt(e.target.value)}
            className="w-full min-h-[80px] rounded-lg border border-white/25 bg-background/70 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
            placeholder="e.g. Focus more on testing and CI/CD, reduce the number of phases to 4..."
            disabled={isGenerating}
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={async () => {
                if (project) {
                  await generateNew({
                    name: project.name,
                    description: project.description ?? undefined,
                    techStack: (project.techStack as string[]) ?? undefined,
                  });
                  setShowRegenPrompt(false);
                  setRegenPrompt('');
                }
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Regenerate without prompt'
              )}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={isGenerating || !regenPrompt.trim()}
              onClick={async () => {
                if (project) {
                  await generateNew({
                    name: project.name,
                    description: project.description ?? undefined,
                    techStack: (project.techStack as string[]) ?? undefined,
                    userPrompt: regenPrompt.trim(),
                  });
                  setShowRegenPrompt(false);
                  setRegenPrompt('');
                }
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Regenerate with Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* AI Refine Prompt — above plan content for easy access */}
      {plan && !isViewingOldVersion && mode === 'view' && !showRegenPrompt && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Refine with AI</h3>
          </div>
          <div className="flex gap-2">
            <textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              className="flex-1 min-h-[60px] rounded-lg border border-white/25 bg-background/70 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
              placeholder="e.g. Add a testing phase before deployment, or break Phase 2 into smaller phases..."
              disabled={isRefining}
            />
            <Button
              onClick={async () => {
                if (refinePrompt.trim()) {
                  await refinePlan(refinePrompt.trim());
                  setRefinePrompt('');
                }
              }}
              disabled={isRefining || !refinePrompt.trim()}
              className="gap-2 self-end"
            >
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Apply
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Describe changes you want — the AI will rewrite the plan while preserving unchanged parts.
          </p>
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
