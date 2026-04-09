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
import { generatePlanWithAI, uploadPlan } from '@/modules/roadmap/actions';
import { Bot, FileText, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Step = 1 | 2;
type PlanMode = 'choose' | 'generating' | 'preview' | 'manual';

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { setProjects, projects, setCurrentProject } = useProjectsStore();

  // Step 1 state
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 state
  const [planMode, setPlanMode] = useState<PlanMode>('choose');
  const [generatedContent, setGeneratedContent] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [isEditingGenerated, setIsEditingGenerated] = useState(false);

  // Shared state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setName('');
    setDescription('');
    setPlanMode('choose');
    setGeneratedContent('');
    setManualContent('');
    setEditableContent('');
    setIsEditingGenerated(false);
    setError(null);
    setCreatedProjectId(null);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  // Step 1: Create the project
  async function handleStep1Submit(e: React.FormEvent) {
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
        setProjects([...projects, result.data]);
        setCurrentProject(result.data.id);
        setCreatedProjectId(result.data.id);
        setStep(2);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 2: Generate plan with AI
  async function handleGenerateAI() {
    if (!createdProjectId) return;
    setPlanMode('generating');
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generatePlanWithAI(createdProjectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.success && result.data) {
        setGeneratedContent(result.data.content);
        setEditableContent(result.data.content);
        setPlanMode('preview');
      } else {
        setError(result.error || 'Failed to generate plan');
        setPlanMode('choose');
      }
    } catch {
      setError('Failed to generate plan');
      setPlanMode('choose');
    } finally {
      setIsGenerating(false);
    }
  }

  // Step 2: Finalize (after AI generation or manual write)
  async function handleFinalize() {
    if (!createdProjectId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (planMode === 'preview' && isEditingGenerated) {
        // User edited the AI-generated plan — upload as new version
        await uploadPlan(createdProjectId, editableContent);
      }
      // If planMode === 'preview' and NOT edited, plan was already saved during generation

      if (planMode === 'manual') {
        if (!manualContent.trim()) {
          setError('Please enter your implementation plan');
          setIsSubmitting(false);
          return;
        }
        const result = await uploadPlan(createdProjectId, manualContent.trim());
        if (!result.success) {
          setError(result.error || 'Failed to save plan');
          setIsSubmitting(false);
          return;
        }
      }

      handleClose();
      router.push(`/projects/${createdProjectId}/roadmap`);
    } catch {
      setError('Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  }

  const templateText = `# Overview
Describe your project goals here.

## Phase 1: Foundation
### Goals
- Set up development environment

### Tasks
- Initialize project structure

### Deliverables
- Working dev environment`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Create New Project' : 'Set Implementation Plan'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Set up your project details.'
              : 'Every project needs a roadmap. Generate one with AI or write your own.'}
          </DialogDescription>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DialogHeader>

        {/* ─── Step 1: Project Details ─── */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
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
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ─── Step 2: Implementation Plan ─── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Choose mode */}
            {planMode === 'choose' && (
              <div className="flex flex-col items-center py-6 gap-6">
                <Sparkles className="h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Your project <strong>{name}</strong> has been created. Now set up the
                  implementation plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleGenerateAI}
                  >
                    <Bot className="h-4 w-4" />
                    Generate with AI
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setPlanMode('manual')}
                  >
                    <FileText className="h-4 w-4" />
                    Write Manually
                  </Button>
                </div>
              </div>
            )}

            {/* Generating */}
            {planMode === 'generating' && (
              <div className="flex flex-col items-center py-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating implementation plan with AI...
                </p>
              </div>
            )}

            {/* Preview AI-generated plan */}
            {planMode === 'preview' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    🤖 AI-generated plan — review and confirm.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingGenerated(!isEditingGenerated)}
                  >
                    {isEditingGenerated ? 'Preview' : 'Edit'}
                  </Button>
                </div>

                {isEditingGenerated ? (
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full min-h-[300px] rounded-lg border bg-background px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <div className="rounded-lg border bg-card p-4 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{editableContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Manual write */}
            {planMode === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Follow the structured format with <code className="bg-muted px-1 rounded text-xs"># Overview</code>,{' '}
                    <code className="bg-muted px-1 rounded text-xs">## Phase N: Name</code>,{' '}
                    <code className="bg-muted px-1 rounded text-xs">### Goals/Tasks/Deliverables</code>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualContent(templateText)}
                  >
                    Use Template
                  </Button>
                </div>
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full min-h-[300px] rounded-lg border bg-background px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={templateText}
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Footer for step 2 */}
            {(planMode === 'preview' || planMode === 'manual') && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanMode('choose')}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleFinalize}
                  disabled={isSubmitting || (planMode === 'manual' && !manualContent.trim())}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    <>
                      Confirm & Go to Roadmap
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
