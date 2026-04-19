'use client';

import type { ImplementationPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { History, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  history: ImplementationPlan[];
  currentVersion: number;
  onSelectVersion: (plan: ImplementationPlan) => void;
};

export function VersionHistory({ history, currentVersion, onSelectVersion }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length <= 1) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5"
      >
        <History className="h-3.5 w-3.5" />
        v{currentVersion}
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/25 bg-popover/95 shadow-xl backdrop-blur dark:border-white/10">
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-white/10">
              <h3 className="text-sm font-semibold">Version History</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-64 overflow-auto p-2">
              {history.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    onSelectVersion(plan);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                    plan.version === currentVersion && 'bg-accent/90'
                  )}
                >
                  <div>
                    <div className="font-medium">
                      Version {plan.version}
                      {plan.isActive && (
                        <span className="ml-2 text-xs text-primary font-normal">
                          (active)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {plan.source === 'ai_generated' ? '🤖 AI Generated' : '📝 Manual'}
                      {' · '}
                      {new Date(plan.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
