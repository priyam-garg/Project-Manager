'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, FileText, Loader2, Sparkles } from 'lucide-react';

type Props = {
  onGenerate: () => Promise<void>;
  onUpload: (content: string) => Promise<void>;
  isGenerating: boolean;
};

export function EmptyPlanState({ onGenerate, onUpload, isGenerating }: Props) {
  const [mode, setMode] = useState<'choose' | 'write'>('choose');
  const [manualContent, setManualContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    if (!manualContent.trim()) return;
    setIsUploading(true);
    await onUpload(manualContent);
    setIsUploading(false);
  }

  const templateText = `# Overview
Describe your project's goals and scope here.

## Phase 1: Setup & Foundation
### Goals
- Set up development environment
- Define project architecture

### Tasks
- Initialize repository and tooling
- Configure CI/CD pipeline

### Deliverables
- Working development environment
- Initial project structure

## Phase 2: Core Features
### Goals
- Implement primary functionality

### Tasks
- Build core modules
- Add data layer

### Deliverables
- Working MVP with core features`;

  if (mode === 'write') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Write Implementation Plan</h2>
          <Button variant="ghost" size="sm" onClick={() => setMode('choose')}>
            ← Back
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Follow the structured format below. Use <code className="bg-muted px-1 rounded"># Overview</code>,{' '}
          <code className="bg-muted px-1 rounded">## Phase N: Name</code>,{' '}
          <code className="bg-muted px-1 rounded">### Goals/Tasks/Deliverables</code>.
        </p>
        <textarea
          value={manualContent}
          onChange={(e) => setManualContent(e.target.value)}
          className="w-full min-h-[400px] rounded-lg border bg-background px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={templateText}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setManualContent(templateText)}>
            Use Template
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!manualContent.trim() || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Plan'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 rounded-full bg-primary/10 p-4">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No Implementation Plan Yet</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Create an implementation plan to guide your project. The plan will be used by the
        AI chat and task generation agent for context-aware assistance.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="gap-2"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Bot className="h-5 w-5" />
              Generate with AI
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => setMode('write')}
        >
          <FileText className="h-5 w-5" />
          Write Manually
        </Button>
      </div>
    </div>
  );
}
