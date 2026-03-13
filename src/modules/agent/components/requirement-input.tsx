'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequirementInputProps {
  onGenerate: (requirement: string) => void;
  isLoading: boolean;
}

const examplePrompts = [
  'Build a user authentication system with email and password',
  'Create a REST API for managing blog posts with CRUD operations',
  'Implement a real-time chat feature using WebSockets',
  'Design a dashboard with analytics charts and metrics',
  'Add file upload functionality with image preview',
];

export function RequirementInput({ onGenerate, isLoading }: RequirementInputProps) {
  const [requirement, setRequirement] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleGenerate = () => {
    const trimmed = requirement.trim();
    if (trimmed && !isLoading) {
      onGenerate(trimmed);
    }
  };

  const handleExampleClick = (example: string) => {
    setRequirement(example);
    setShowExamples(false);
  };

  const canGenerate = requirement.trim().length > 0 && !isLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="requirement" className="text-sm font-medium">
            Describe your requirement
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => setShowExamples(!showExamples)}
          >
            <Lightbulb className="h-3 w-3" />
            <span className="text-xs">Examples</span>
          </Button>
        </div>

        {showExamples && (
          <div className="p-3 bg-muted rounded-lg space-y-2 animate-in fade-in-50 slide-in-from-top-2">
            <p className="text-xs font-medium text-muted-foreground">Click to use:</p>
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className="block w-full text-left text-sm p-2 rounded hover:bg-background transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <Textarea
          id="requirement"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder="Example: Build a user authentication system with email verification and password reset functionality..."
          disabled={isLoading}
          className={cn(
            'min-h-[120px] resize-none',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
            Generating tasks...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate tasks
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        The AI agent will analyze your requirement and break it down into actionable tasks
      </p>
    </div>
  );
}
