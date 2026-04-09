import type { PlanSection } from '@/core/db/schema';

/**
 * Parse a standardized markdown implementation plan into structured PlanSection[].
 *
 * Expected format:
 * # Overview
 * ...content...
 *
 * ## Phase 1: Phase Name
 * ### Goals
 * - ...
 * ### Tasks
 * - ...
 * ### Deliverables
 * - ...
 */
export function parsePlanToSections(markdown: string): PlanSection[] {
  const sections: PlanSection[] = [];
  const lines = markdown.split('\n');

  let currentPhase = '';
  let currentPhaseNumber = 0;
  let currentSectionType: PlanSection['sectionType'] | null = null;
  let currentContent: string[] = [];
  let currentItems: string[] = [];

  function flush() {
    if (currentSectionType && (currentContent.length > 0 || currentItems.length > 0)) {
      sections.push({
        id: crypto.randomUUID(),
        phase: currentPhase,
        phaseNumber: currentPhaseNumber,
        sectionType: currentSectionType,
        content: currentContent.join('\n').trim(),
        items: [...currentItems],
      });
    }
    currentContent = [];
    currentItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // # Overview
    if (/^#\s+overview/i.test(trimmed)) {
      flush();
      currentPhase = 'Overview';
      currentPhaseNumber = 0;
      currentSectionType = 'overview';
      continue;
    }

    // ## Phase N: Name
    const phaseMatch = trimmed.match(/^##\s+Phase\s+(\d+)\s*:\s*(.+)/i);
    if (phaseMatch) {
      flush();
      currentPhaseNumber = parseInt(phaseMatch[1], 10);
      currentPhase = `Phase ${currentPhaseNumber}: ${phaseMatch[2].trim()}`;
      currentSectionType = null; // Wait for ### Goals/Tasks/Deliverables
      continue;
    }

    // ### Goals
    if (/^###\s+goals/i.test(trimmed)) {
      flush();
      currentSectionType = 'goals';
      continue;
    }

    // ### Tasks
    if (/^###\s+tasks/i.test(trimmed)) {
      flush();
      currentSectionType = 'tasks';
      continue;
    }

    // ### Deliverables
    if (/^###\s+deliverables/i.test(trimmed)) {
      flush();
      currentSectionType = 'deliverables';
      continue;
    }

    // Collect content
    if (currentSectionType) {
      // Parse bullet items
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
      if (bulletMatch) {
        currentItems.push(bulletMatch[1].trim());
      }
      currentContent.push(line);
    }
  }

  // Flush the last section
  flush();

  return sections;
}

/**
 * Reconstruct full markdown from structured PlanSection[].
 */
export function sectionsToMarkdown(sections: PlanSection[]): string {
  const sorted = [...sections].sort((a, b) => {
    if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
    const order = { overview: 0, goals: 1, tasks: 2, deliverables: 3 };
    return order[a.sectionType] - order[b.sectionType];
  });

  const parts: string[] = [];
  let lastPhaseNumber = -1;

  for (const section of sorted) {
    if (section.sectionType === 'overview') {
      parts.push('# Overview');
      parts.push(section.content || section.items.map((i) => `- ${i}`).join('\n'));
      parts.push('');
      continue;
    }

    // Emit phase heading if this is a new phase
    if (section.phaseNumber !== lastPhaseNumber) {
      parts.push(`## ${section.phase}`);
      lastPhaseNumber = section.phaseNumber;
    }

    // Emit section heading
    const typeLabel =
      section.sectionType.charAt(0).toUpperCase() + section.sectionType.slice(1);
    parts.push(`### ${typeLabel}`);

    // Emit content — prefer items if available, else raw content
    if (section.items.length > 0) {
      parts.push(section.items.map((i) => `- ${i}`).join('\n'));
    } else if (section.content) {
      parts.push(section.content);
    }

    parts.push('');
  }

  return parts.join('\n').trim() + '\n';
}
