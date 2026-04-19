'use client';

import type { PlanSection } from '@/types';
import { PhaseSection } from './PhaseSection';
import ReactMarkdown from 'react-markdown';

type Props = {
  sections: PlanSection[];
  regeneratingPhase: number | null;
  onRegeneratePhase: (phaseNumber: number) => void;
  onUpdateSection: (sectionId: string, content: string, items: string[]) => Promise<void>;
};

export function PlanViewer({
  sections,
  regeneratingPhase,
  onRegeneratePhase,
  onUpdateSection,
}: Props) {
  // Group sections by phase
  const overviewSections = sections.filter((s) => s.sectionType === 'overview');
  const phaseSections = sections.filter((s) => s.sectionType !== 'overview');

  // Group by phaseNumber
  const phaseGroups = new Map<number, { phase: string; sections: PlanSection[] }>();
  for (const s of phaseSections) {
    if (!phaseGroups.has(s.phaseNumber)) {
      phaseGroups.set(s.phaseNumber, { phase: s.phase, sections: [] });
    }
    phaseGroups.get(s.phaseNumber)!.sections.push(s);
  }

  const sortedPhases = [...phaseGroups.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4">
      {/* Overview */}
      {overviewSections.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs">
              📋
            </span>
            Overview
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {overviewSections.map((s) => (
              <ReactMarkdown key={s.id}>{s.content}</ReactMarkdown>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      {sortedPhases.map(([phaseNumber, group]) => (
        <PhaseSection
          key={phaseNumber}
          phase={group.phase}
          phaseNumber={phaseNumber}
          sections={group.sections}
          isRegenerating={regeneratingPhase === phaseNumber}
          onRegeneratePhase={() => onRegeneratePhase(phaseNumber)}
          onUpdateSection={onUpdateSection}
        />
      ))}
    </div>
  );
}
