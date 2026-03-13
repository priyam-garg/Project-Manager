'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
  className?: string;
}

const suggestedQuestions = [
  {
    icon: TrendingUp,
    question: 'What is the current sprint progress?',
    color: 'text-blue-500',
  },
  {
    icon: Users,
    question: 'Show me tasks assigned to team members',
    color: 'text-green-500',
  },
  {
    icon: Calendar,
    question: 'What are the high-priority tasks this week?',
    color: 'text-orange-500',
  },
  {
    icon: MessageSquare,
    question: 'Summarize recent project activity',
    color: 'text-purple-500',
  },
];

export function SuggestedQuestions({ onQuestionClick, className }: SuggestedQuestionsProps) {
  return (
    <div className={cn('space-y-4 animate-in fade-in-50 duration-500', className)}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Ask about your project</h3>
        <p className="text-sm text-muted-foreground">
          Get insights and information using natural language
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {suggestedQuestions.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className={cn(
                'h-auto py-4 px-4 justify-start text-left',
                'hover:bg-accent hover:border-primary/50 transition-all',
                'animate-in fade-in-50 slide-in-from-bottom-4'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onQuestionClick(item.question)}
            >
              <Icon className={cn('h-5 w-5 mr-3 flex-shrink-0', item.color)} />
              <span className="text-sm">{item.question}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
