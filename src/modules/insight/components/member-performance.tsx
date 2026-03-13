'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MemberPerformance } from '@/types';
import { User, CheckCircle2, Clock } from 'lucide-react';

interface MemberPerformanceProps {
  data: MemberPerformance[];
}

export function MemberPerformanceComponent({ data }: MemberPerformanceProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Team Performance</h3>
          <p className="text-sm text-muted-foreground">Tasks completed and in progress per member</p>
        </div>

        <div className="space-y-3">
          {data.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.userName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span>{member.tasksCompleted} completed</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      <span>{member.tasksInProgress} in progress</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Badge variant="secondary" className="font-semibold">
                  {member.tasksCompleted + member.tasksInProgress} total
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No team member data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
