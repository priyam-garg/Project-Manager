'use client';

import { useState, useCallback } from 'react';
import type { ImplementationPlan, PlanSection } from '@/types';
import {
  getImplementationPlan,
  getPlanVersionHistory,
  updateImplementationPlan,
  updatePlanSectionAction,
  regeneratePhaseWithAI,
  generatePlanWithAI,
  uploadPlan,
  refinePlanWithAI,
} from '@/modules/roadmap/actions';

export function useRoadmap(projectId: string) {
  const [plan, setPlan] = useState<ImplementationPlan | null>(null);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ImplementationPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [regeneratingPhase, setRegeneratingPhase] = useState<number | null>(null);

  const loadPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getImplementationPlan(projectId);
      if (result.success && result.data) {
        setPlan(result.data);
        setSections((result.data.sections as PlanSection[]) ?? []);
      } else {
        setPlan(null);
        setSections([]);
      }
    } catch {
      setError('Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await getPlanVersionHistory(projectId);
      if (result.success && result.data) {
        setHistory(result.data);
      }
    } catch {
      console.warn('Failed to load plan history');
    }
  }, [projectId]);

  const saveFull = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await updateImplementationPlan(projectId, content);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
        } else {
          setError(result.error || 'Failed to save plan');
        }
      } catch {
        setError('Failed to save plan');
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const updateSection = useCallback(
    async (sectionId: string, content: string, items: string[]) => {
      if (!plan) return;
      try {
        const result = await updatePlanSectionAction(plan.id, sectionId, content, items);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
        }
      } catch {
        setError('Failed to update section');
      }
    },
    [plan]
  );

  const regeneratePhase = useCallback(
    async (phaseNumber: number, userPrompt?: string) => {
      setRegeneratingPhase(phaseNumber);
      setError(null);
      try {
        const result = await regeneratePhaseWithAI(projectId, phaseNumber, userPrompt);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
        } else {
          setError(result.error || 'Failed to regenerate phase');
        }
      } catch {
        setError('Failed to regenerate phase');
      } finally {
        setRegeneratingPhase(null);
      }
    },
    [projectId]
  );

  const generateNew = useCallback(
    async (details: {
      name: string;
      description?: string;
      techStack?: string[];
      userPrompt?: string;
    }) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generatePlanWithAI(projectId, details);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
          return result.data;
        } else {
          setError(result.error || 'Failed to generate plan');
          return null;
        }
      } catch {
        setError('Failed to generate plan');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [projectId]
  );

  const uploadNew = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await uploadPlan(projectId, content);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
          return result.data;
        } else {
          setError(result.error || 'Failed to upload plan');
          return null;
        }
      } catch {
        setError('Failed to upload plan');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const refinePlan = useCallback(
    async (userPrompt: string) => {
      setIsRefining(true);
      setError(null);
      try {
        const result = await refinePlanWithAI(projectId, userPrompt);
        if (result.success && result.data) {
          setPlan(result.data);
          setSections((result.data.sections as PlanSection[]) ?? []);
          return result.data;
        } else {
          setError(result.error || 'Failed to refine plan');
          return null;
        }
      } catch {
        setError('Failed to refine plan');
        return null;
      } finally {
        setIsRefining(false);
      }
    },
    [projectId]
  );

  return {
    plan,
    sections,
    isLoading,
    error,
    history,
    isGenerating,
    isRefining,
    regeneratingPhase,
    loadPlan,
    loadHistory,
    saveFull,
    updateSection,
    regeneratePhase,
    generateNew,
    uploadNew,
    refinePlan,
  };
}
