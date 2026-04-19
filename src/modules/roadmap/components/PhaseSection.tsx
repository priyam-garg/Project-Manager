'use client';

import { useState } from 'react';
import type { PlanSection } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Pencil, RefreshCw, X, Check, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  phase: string;
  phaseNumber: number;
  sections: PlanSection[];
  isRegenerating: boolean;
  onRegeneratePhase: (userPrompt?: string) => void;
  onUpdateSection: (sectionId: string, content: string, items: string[]) => Promise<void>;
};

export function PhaseSection({
  phase,
  phaseNumber,
  sections,
  isRegenerating,
  onRegeneratePhase,
  onUpdateSection,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');

  function startEdit(section: PlanSection) {
    setEditingSectionId(section.id);
    setEditContent(
      section.items.length > 0
        ? section.items.map((i) => `- ${i}`).join('\n')
        : section.content
    );
  }

  async function saveEdit(section: PlanSection) {
    setIsSaving(true);
    const lines = editContent.split('\n');
    const items = lines
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
    await onUpdateSection(section.id, editContent, items);
    setEditingSectionId(null);
    setIsSaving(false);
  }

  function cancelEdit() {
    setEditingSectionId(null);
    setEditContent('');
  }

  const sectionTypeLabels: Record<string, string> = {
    goals: '🎯 Goals',
    tasks: '📋 Tasks',
    deliverables: '📦 Deliverables',
  };

  return (
    <div className="glass-card transition-all">
      {/* Phase Header */}
      <div className="flex w-full items-center justify-between rounded-t-lg p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsCollapsed(!isCollapsed)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCollapsed(!isCollapsed); }}
          className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {phaseNumber}
            </span>
            <h3 className="text-base font-semibold">{phase}</h3>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={isRegenerating}
          onClick={() => setShowPrompt(!showPrompt)}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>

      {/* Regenerate Prompt — inline */}
      {showPrompt && !isRegenerating && (
        <div className="mx-4 mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Regenerate Phase {phaseNumber}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setShowPrompt(false); setPromptText(''); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full min-h-[50px] rounded-md border border-white/25 bg-background/70 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
            placeholder="e.g. Add more detail on API integration, focus on testing..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                onRegeneratePhase();
                setShowPrompt(false);
                setPromptText('');
              }}
            >
              Regenerate without prompt
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              disabled={!promptText.trim()}
              onClick={() => {
                onRegeneratePhase(promptText.trim());
                setShowPrompt(false);
                setPromptText('');
              }}
            >
              <Send className="h-3 w-3" />
              Regenerate with Prompt
            </Button>
          </div>
        </div>
      )}

      {/* Phase Content */}
      {!isCollapsed && (
        <div className="divide-y border-t border-white/20 px-4 pb-4 dark:border-white/10">
          {sections.map((section) => (
            <div key={section.id} className="py-3 first:pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {sectionTypeLabels[section.sectionType] || section.sectionType}
                </h4>
                {editingSectionId !== section.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => startEdit(section)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {editingSectionId === section.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[120px] rounded-xl border border-white/25 bg-background/70 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
                    placeholder="Enter content (use - for bullet points)"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveEdit(section)}
                      disabled={isSaving}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5 ml-1">
                  {section.items.length > 0 ? (
                    section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {section.content || 'No content yet'}
                    </p>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
