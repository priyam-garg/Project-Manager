'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TaskGenerationResponse } from '@/types';
import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationHistoryItem {
  id: string;
  requirement: string;
  timestamp: Date;
  result: TaskGenerationResponse;
}

interface GenerationHistoryProps {
  history: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
  currentId?: string;
}

export function GenerationHistory({ history, onSelect, currentId }: GenerationHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Generation History</h3>
      <div className="space-y-2">
        {history.map((item) => {
          const isActive = item.id === currentId;
          const timeAgo = getTimeAgo(item.timestamp);

          return (
            <Card
              key={item.id}
              className={cn(
                'p-3 cursor-pointer transition-all hover:border-primary/50',
                isActive && 'border-primary bg-primary/5'
              )}
              onClick={() => onSelect(item)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">
                    {item.requirement}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo}</span>
                    <span>•</span>
                    <span>{item.result.tasks.length} tasks</span>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform',
                    isActive && 'text-primary'
                  )}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
