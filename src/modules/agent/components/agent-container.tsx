'use client';

import { useEffect, useState } from 'react';
import { RequirementInput } from './requirement-input';
import { GeneratedTasksList } from './generated-tasks-list';
import { GenerationHistory } from './generation-history';
import { useAgent } from '../hooks/use-agent';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { GeneratedTask, TaskGenerationResponse } from '@/types';
import { Card } from '@/components/ui/card';


interface AgentContainerProps {
  projectId: string;
}

interface HistoryItem {
  id: string;
  requirement: string;
  timestamp: Date;
  result: TaskGenerationResponse;
}

export function AgentContainer({ projectId }: AgentContainerProps) {
  const router = useRouter();
  const { isGenerating, currentGeneration, generate, acceptTasks } = useAgent(projectId);
  const [isAccepting, setIsAccepting] = useState(false);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();
  const [displayedGeneration, setDisplayedGeneration] = useState<TaskGenerationResponse | null>(null);

  const handleGenerate = async (requirement: string) => {
    const generated = await generate(requirement);
    
    // Add to local history with timestamp
    if (generated) {
      const historyItem: HistoryItem = {
        id: `gen-${Date.now()}`,
        requirement,
        timestamp: new Date(),
        result: generated,
      };
      setLocalHistory((prev) => [historyItem, ...prev]);
      setSelectedHistoryId(historyItem.id);
      setDisplayedGeneration(generated);
    }
  };

  // Update displayed generation when current generation changes
  useEffect(() => {
    if (currentGeneration && currentGeneration !== displayedGeneration && !selectedHistoryId) {
      setDisplayedGeneration(currentGeneration);
    }
  }, [currentGeneration, displayedGeneration, selectedHistoryId]);

  const handleAcceptTasks = async (tasks: GeneratedTask[]) => {
    setIsAccepting(true);
    const result = await acceptTasks(tasks);
    setIsAccepting(false);

    if (result.success) {
      toast.success(`Successfully added ${tasks.length} task${tasks.length > 1 ? 's' : ''} to the project`);
      // Navigate to board to see the new tasks
      router.push(`/projects/${projectId}/board`);
    } else {
      toast.error(result.error || 'Failed to add tasks');
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setDisplayedGeneration(item.result);
  };

  return (
    <div className="h-full overflow-y-auto soft-scrollbar">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Senior Architect Agent</h1>
          <p className="text-muted-foreground">
            Describe your requirements and let the AI agent break them down into actionable tasks
          </p>
        </div>

        {/* Requirement Input */}
        <Card className="p-5 sm:p-6">
          <RequirementInput onGenerate={handleGenerate} isLoading={isGenerating} />
        </Card>

        {/* Generation History */}
        {localHistory.length > 0 && (
          <Card className="p-5 sm:p-6">
            <GenerationHistory
              history={localHistory}
              onSelect={handleHistorySelect}
              currentId={selectedHistoryId}
            />
          </Card>
        )}

        {/* Generated Tasks */}
        {displayedGeneration && (
          <Card className="p-5 sm:p-6">
            <GeneratedTasksList
              tasks={displayedGeneration.tasks}
              reasoning={displayedGeneration.reasoning}
              onAccept={handleAcceptTasks}
              isAccepting={isAccepting}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
