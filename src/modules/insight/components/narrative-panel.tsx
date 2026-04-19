'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateNarrative } from '../actions';
import type { DateRangeFilter } from '@/types';

interface NarrativePanelProps {
  projectId: string;
  dateRange: DateRangeFilter;
  hasData: boolean;
}

export function NarrativePanel({ projectId, dateRange, hasData }: NarrativePanelProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when date range changes
  useEffect(() => {
    setNarrative(null);
    setError(null);
  }, [dateRange]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    const result = await generateNarrative(projectId, dateRange);

    if (result.success && result.data) {
      setNarrative(result.data);
    } else {
      setError(result.error || 'Failed to generate narrative');
    }

    setIsGenerating(false);
  }

  return (
    <Card className="space-y-4 border-primary/20 bg-primary/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Insight Summary</h2>
        </div>
        <Button
          size="sm"
          variant={narrative ? 'outline' : 'default'}
          onClick={handleGenerate}
          disabled={!hasData || isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : narrative ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Body */}
      {isGenerating && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
      )}

      {error && !isGenerating && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}

      {narrative && !isGenerating && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{narrative}</ReactMarkdown>
        </div>
      )}

      {!narrative && !isGenerating && !error && (
        <p className="text-sm text-muted-foreground">
          Click Generate to get an AI-powered analysis of your project metrics.
        </p>
      )}
    </Card>
  );
}
