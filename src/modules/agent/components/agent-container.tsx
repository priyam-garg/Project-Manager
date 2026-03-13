'use client';

import { useState } from 'react';
import { RequirementInput } from './requirement-input';
import { GeneratedTasksList } from './generated-tasks-list';
import { GenerationHistory } from './generation-history';
import { useAgent } from '../hooks/use-agent';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { GeneratedTask, TaskGenerationResponse } from '@/types';


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
  const { isGenerating, currentGeneration, history: hookHistory, generate, acceptTasks } = useAgent(projectId);
  const [isAccepting, setIsAccepting] = useState(false);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();
  const [displayedGeneration, setDisplayedGeneration] = useState<TaskGenerationResponse | null>(null);

  const handleGenerate = async (requirement: string) => {
    await generate(requirement);
    
    // Add to local history with timestamp
    if (currentGeneration) {
      const historyItem: HistoryItem = {
        id: `gen-${Date.now()}`,
        requirement,
        timestamp: new Date(),
        result: currentGeneration,
      };
      setLocalHistory((prev) => [historyItem, ...prev]);
      setSelectedHistoryId(historyItem.id);
      setDisplayedGeneration(currentGeneration);
    }
  };

  // Update displayed generation when current generation changes
  if (currentGeneration && currentGeneration !== displayedGeneration && !selectedHistoryId) {
    setDisplayedGeneration(currentGeneration);
  }

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

  const handleRegenerate = () => {
    setSelectedHistoryId(undefined);
    setDisplayedGeneration(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Senior Architect Agent</h1>
          <p className="text-muted-foreground">
            Describe your requirements and let the AI agent break them down into actionable tasks
          </p>
        </div>

        <div className="border-t" />

        {/* Requirement Input */}
        <RequirementInput onGenerate={handleGenerate} isLoading={isGenerating} />

        {/* Generation History */}
        {localHistory.length > 0 && (
          <>
            <div className="border-t" />
            <GenerationHistory
              history={localHistory}
              onSelect={handleHistorySelect}
              currentId={selectedHistoryId}
            />
          </>
        )}

        {/* Generated Tasks */}
        {displayedGeneration && (
          <>
            <div className="border-t" />
            <GeneratedTasksList
              tasks={displayedGeneration.tasks}
              reasoning={displayedGeneration.reasoning}
              onAccept={handleAcceptTasks}
              isAccepting={isAccepting}
            />
          </>
        )}
      </div>
    </div>
  );
}
