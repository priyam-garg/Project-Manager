'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TaskEditor } from './task-editor';
import type { GeneratedTask } from '@/types';
import { CheckCircle2, Circle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratedTasksListProps {
  tasks: GeneratedTask[];
  reasoning: string;
  onAccept: (tasks: GeneratedTask[]) => void;
  isAccepting: boolean;
}

export function GeneratedTasksList({ 
  tasks: initialTasks, 
  reasoning, 
  onAccept, 
  isAccepting 
}: GeneratedTasksListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(initialTasks.map((_, i) => i))
  );

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === tasks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(tasks.map((_, i) => i)));
    }
  };

  const handleTaskChange = (index: number, updatedTask: GeneratedTask) => {
    const newTasks = [...tasks];
    newTasks[index] = updatedTask;
    setTasks(newTasks);
  };

  const handleAcceptAll = () => {
    onAccept(tasks);
  };

  const handleAcceptSelected = () => {
    const selectedTasks = tasks.filter((_, i) => selectedIndices.has(i));
    onAccept(selectedTasks);
  };

  const selectedCount = selectedIndices.size;
  const allSelected = selectedCount === tasks.length;

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      {/* Reasoning Section */}
      <Card className="p-4 bg-muted/50">
        <div className="flex gap-3">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-sm">Agent Reasoning</h3>
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </div>
        </div>
      </Card>

      {/* Tasks Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Generated Tasks</h3>
          <span className="text-sm text-muted-foreground">
            ({selectedCount} of {tasks.length} selected)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleAll}
          className="gap-2"
        >
          {allSelected ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Deselect All
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskEditor
            key={index}
            task={task}
            isSelected={selectedIndices.has(index)}
            onToggleSelect={() => handleToggleSelect(index)}
            onChange={(updatedTask) => handleTaskChange(index, updatedTask)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleAcceptAll}
          disabled={isAccepting || tasks.length === 0}
          className="flex-1"
          size="lg"
        >
          {isAccepting ? 'Adding tasks...' : `Accept All (${tasks.length})`}
        </Button>
        <Button
          onClick={handleAcceptSelected}
          disabled={isAccepting || selectedCount === 0}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          {isAccepting ? 'Adding tasks...' : `Accept Selected (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}
