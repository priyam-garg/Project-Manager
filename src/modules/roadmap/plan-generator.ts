import type { PlanSection } from '@/core/db/schema';
import { parsePlanToSections, sectionsToMarkdown } from './plan-parser';

// ─── LLM Config (same pattern as architect/graph.ts) ─────────────────────────

function getLLMConfig() {
  const provider = (process.env.AI_PROVIDER?.toLowerCase() || 'openai') as string;

  if (provider === 'gemini') {
    return {
      apiKey: process.env.GEMINI_API_KEY || '',
      baseUrl:
        process.env.GEMINI_BASE_URL ||
        'https://generativelanguage.googleapis.com/v1beta/openai',
      model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    };
  }

  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  };
}

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const config = getLLMConfig();

  if (!config.apiKey) {
    throw new Error('AI provider is not configured. Set the appropriate API key.');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('LLM response did not include content.');
  }

  return content;
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const PLAN_GENERATOR_PROMPT = `You are a Senior Technical Project Manager creating an implementation plan (roadmap) for a software project.

You MUST use this exact markdown structure:

# Overview
A brief paragraph describing the project's goals and scope.

## Phase 1: [Phase Name]
### Goals
- Goal 1
- Goal 2

### Tasks
- Task 1
- Task 2

### Deliverables
- Deliverable 1

## Phase 2: [Phase Name]
### Goals
...
### Tasks
...
### Deliverables
...

Rules:
1. Create 3-6 phases depending on project complexity.
2. Phases should progress logically: setup/foundation → core features → integration → testing → polish → deployment.
3. Each phase must have Goals and Tasks sections. Deliverables is optional but recommended.
4. Goals should describe what the phase achieves at a high level.
5. Tasks should be specific, actionable items.
6. Deliverables should describe tangible outputs.
7. Be practical and specific to the project described — avoid generic filler.
8. Do NOT wrap the output in code blocks. Output the markdown directly.`;

const PLAN_REFINE_PROMPT = `You are a Senior Technical Project Manager revising an existing implementation plan based on user feedback.

You will receive the full existing plan and a user instruction describing what to change.

Rewrite the ENTIRE plan incorporating the user's requested changes. Keep the same markdown structure:

# Overview
...

## Phase N: [Phase Name]
### Goals
- ...
### Tasks
- ...
### Deliverables
- ...

Rules:
1. Preserve parts the user did NOT ask to change.
2. Apply the user's changes accurately and thoroughly.
3. Keep 3-6 phases with logical progression.
4. Be practical and specific.
5. Do NOT wrap the output in code blocks. Output the markdown directly.`;

const PHASE_REGENERATOR_PROMPT = `You are a Senior Technical Project Manager revising one phase of an implementation plan.

You will receive the full existing plan for context, and a specific phase number to regenerate.

Rewrite ONLY the specified phase. Keep the same phase number and the standard format:

## Phase N: [Phase Name]
### Goals
- ...
### Tasks
- ...
### Deliverables
- ...

Rules:
1. Consider the other phases for context — don't duplicate work from other phases.
2. Be practical and specific.
3. Output ONLY the phase markdown (starting with "## Phase N:"). No extra text.
4. Do NOT wrap in code blocks.`;

// ─── Public API ──────────────────────────────────────────────────────────────

export type PlanGenerationInput = {
  projectName: string;
  description?: string;
  techStack?: string[];
  guidelines?: string;
  userPrompt?: string;
};

export type PlanGenerationResult = {
  content: string;
  sections: PlanSection[];
};

/**
 * Generate a full implementation plan using AI.
 */
export async function generateImplementationPlan(
  input: PlanGenerationInput
): Promise<PlanGenerationResult> {
  const parts: string[] = [`Project: ${input.projectName}`];
  if (input.description) parts.push(`Description: ${input.description}`);
  if (input.techStack?.length) parts.push(`Tech Stack: ${input.techStack.join(', ')}`);
  if (input.guidelines) parts.push(`Architectural Guidelines:\n${input.guidelines}`);
  if (input.userPrompt) parts.push(`Additional Instructions from User:\n${input.userPrompt}`);

  const userMessage = `Create an implementation plan/roadmap for the following project:\n\n${parts.join('\n')}`;

  const content = await callLLM(PLAN_GENERATOR_PROMPT, userMessage);
  const sections = parsePlanToSections(content);

  return { content, sections };
}

/**
 * Refine an existing plan based on a user instruction.
 */
export async function refinePlanWithPrompt(input: {
  projectName: string;
  existingPlan: string;
  userPrompt: string;
  description?: string;
}): Promise<PlanGenerationResult> {
  const userMessage = `Project: ${input.projectName}${input.description ? `\nDescription: ${input.description}` : ''}

Existing implementation plan:
${input.existingPlan}

User's requested changes:
${input.userPrompt}

Please rewrite the full plan incorporating these changes.`;

  const content = await callLLM(PLAN_REFINE_PROMPT, userMessage);
  const sections = parsePlanToSections(content);

  return { content, sections };
}

/**
 * Regenerate a single phase of an existing plan using AI.
 */
export async function regeneratePhase(input: {
  projectName: string;
  existingPlan: string;
  phaseNumber: number;
  description?: string;
  userPrompt?: string;
}): Promise<PlanGenerationResult> {
  const userMessage = `Project: ${input.projectName}${input.description ? `\nDescription: ${input.description}` : ''}

Existing implementation plan:
${input.existingPlan}

Please regenerate Phase ${input.phaseNumber}.${input.userPrompt ? `\n\nUser instructions for this phase:\n${input.userPrompt}` : ''} Output only the phase markdown.`;

  const phaseMarkdown = await callLLM(PHASE_REGENERATOR_PROMPT, userMessage);

  // Parse the regenerated phase
  const newPhaseSections = parsePlanToSections(phaseMarkdown);

  // Merge into existing plan: parse full plan, replace the target phase, reconstruct
  const existingSections = parsePlanToSections(input.existingPlan);
  const otherSections = existingSections.filter(
    (s) => s.phaseNumber !== input.phaseNumber
  );
  const mergedSections = [...otherSections, ...newPhaseSections].sort((a, b) => {
    if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
    const order: Record<string, number> = { overview: 0, goals: 1, tasks: 2, deliverables: 3 };
    return (order[a.sectionType] ?? 99) - (order[b.sectionType] ?? 99);
  });

  const content = sectionsToMarkdown(mergedSections);

  return { content, sections: mergedSections };
}
