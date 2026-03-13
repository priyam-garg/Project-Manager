import { useState } from 'react';
import { generateTasks, acceptGeneratedTasks } from '../actions';
import type { TaskGenerationResponse, GeneratedTask } from '@/types';

export function useAgent(projectId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<TaskGenerationResponse | null>(null);
  const [history, setHistory] = useState<Array<{ requirement: string; result: TaskGenerationResponse }>>([]);

  const generate = async (requirement: string) => {
    setIsGenerating(true);
    const result = await generateTasks({ projectId, requirement });
    setIsGenerating(false);

    if (result.success && result.data) {
      setCurrentGeneration(result.data);
      setHistory((prev) => [...prev, { requirement, result: result.data! }]);
    }
  };

  const acceptTasks = async (tasks: GeneratedTask[]) => {
    const result = await acceptGeneratedTasks(projectId, tasks);
    return result;
  };

  return {
    isGenerating,
    currentGeneration,
    history,
    generate,
    acceptTasks,
  };
}
