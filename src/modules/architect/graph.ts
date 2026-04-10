import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { architectPrompts } from './prompts';
import {
  ArchitectOutputSchema,
  CritiqueSchema,
  type ArchitectOutputType,
  type CritiqueType,
} from './schemas';

// ─── State Definition ────────────────────────────────────────────────────────

const ArchitectAnnotation = Annotation.Root({
  // Inputs
  requirement: Annotation<string>,
  projectName: Annotation<string>,
  projectDescription: Annotation<string>,
  techStack: Annotation<string[]>,
  architecturalGuidelines: Annotation<string>,
  existingTasks: Annotation<string>,
  repoCodeContext: Annotation<string>,

  // Internal
  plan: Annotation<ArchitectOutputType | null>,
  critique: Annotation<CritiqueType | null>,
  iteration: Annotation<number>,

  // Output
  finalTasks: Annotation<ArchitectOutputType | null>,
});

type ArchitectState = typeof ArchitectAnnotation.State;

// ─── LLM via raw fetch (same pattern as existing chat.ts) ────────────────────

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

async function callLLM(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
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
      temperature: 0.3,
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

// ─── JSON Parsing Helper ─────────────────────────────────────────────────────

function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

// ─── JSON Schema Descriptions (for prompts) ─────────────────────────────────

const TASK_JSON_SCHEMA = `{
  "tasks": [
    {
      "title": "string (concise, action-oriented, max 80 chars)",
      "description": "string (detailed, with acceptance criteria)",
      "priority": "low" | "medium" | "high",
      "storyPoints": number (Fibonacci: 1, 2, 3, 5, 8, 13),
      "tags": ["string"] (e.g., "backend", "frontend", "database")
    }
  ],
  "reasoning": "string (architectural reasoning for the task breakdown)"
}`;

const CRITIQUE_JSON_SCHEMA = `{
  "issues": [
    {
      "severity": "minor" | "major",
      "description": "string (what is missing or wrong)",
      "suggestion": "string (how to fix it)"
    }
  ],
  "overallAssessment": "acceptable" | "needs_revision"
}`;

// ─── Helper: Build context string ────────────────────────────────────────────

function buildProjectContext(state: ArchitectState): string {
  const parts: string[] = [];
  if (state.projectName) parts.push(`Project: ${state.projectName}`);
  if (state.projectDescription)
    parts.push(`Description: ${state.projectDescription}`);
  if (state.techStack?.length)
    parts.push(`Tech Stack: ${state.techStack.join(', ')}`);
  if (state.architecturalGuidelines)
    parts.push(`Architectural Guidelines:\n${state.architecturalGuidelines}`);
  if (state.existingTasks)
    parts.push(`\nExisting Tasks in Project (DO NOT duplicate these — build on top of them or reference them as dependencies):\n${state.existingTasks}`);
  if (state.repoCodeContext)
    parts.push(`\nRelevant Existing Code from Connected Repository (use this to ground tasks in the actual codebase — reference real files, avoid recreating what already exists):\n${state.repoCodeContext}`);
  return parts.length > 0
    ? `\n\nProject Context:\n${parts.join('\n')}`
    : '';
}

// ─── Graph Nodes ─────────────────────────────────────────────────────────────

async function planNode(state: ArchitectState): Promise<Partial<ArchitectState>> {
  const context = buildProjectContext(state);
  const critiqueNote =
    state.critique && state.iteration > 0
      ? `\n\nPrevious critique feedback to address:\n${JSON.stringify(state.critique.issues, null, 2)}`
      : '';

  const systemPrompt = `${architectPrompts.planner}\n\nYou MUST respond with ONLY valid JSON matching this schema:\n${TASK_JSON_SCHEMA}\n\nDo NOT include any text before or after the JSON. Do NOT wrap in markdown code blocks.`;
  const userMessage = `Requirement: ${state.requirement}${context}${critiqueNote}\n\nDecompose this requirement into actionable development tasks. Respond with JSON only.`;

  const raw = await callLLM(systemPrompt, userMessage);
  const parsed = ArchitectOutputSchema.parse(JSON.parse(extractJSON(raw)));

  return {
    plan: parsed,
    iteration: state.iteration + 1,
  };
}

async function critiqueNode(
  state: ArchitectState
): Promise<Partial<ArchitectState>> {
  const context = buildProjectContext(state);

  const systemPrompt = `${architectPrompts.critic}\n\nYou MUST respond with ONLY valid JSON matching this schema:\n${CRITIQUE_JSON_SCHEMA}\n\nDo NOT include any text before or after the JSON. Do NOT wrap in markdown code blocks.`;
  const userMessage = `Requirement: ${state.requirement}${context}\n\nProposed plan:\n${JSON.stringify(state.plan, null, 2)}\n\nReview this task breakdown and identify any issues. Respond with JSON only.`;

  const raw = await callLLM(systemPrompt, userMessage);
  const parsed = CritiqueSchema.parse(JSON.parse(extractJSON(raw)));

  return { critique: parsed };
}

async function finalizeNode(
  state: ArchitectState
): Promise<Partial<ArchitectState>> {
  const context = buildProjectContext(state);

  const systemPrompt = `${architectPrompts.finalizer}\n\nYou MUST respond with ONLY valid JSON matching this schema:\n${TASK_JSON_SCHEMA}\n\nDo NOT include any text before or after the JSON. Do NOT wrap in markdown code blocks.`;
  const userMessage = `Requirement: ${state.requirement}${context}\n\nPlan:\n${JSON.stringify(state.plan, null, 2)}\n\nCritique:\n${JSON.stringify(state.critique, null, 2)}\n\nProduce the final, polished task breakdown addressing all feedback. Respond with JSON only.`;

  const raw = await callLLM(systemPrompt, userMessage);
  const parsed = ArchitectOutputSchema.parse(JSON.parse(extractJSON(raw)));

  return { finalTasks: parsed };
}

// ─── Routing ─────────────────────────────────────────────────────────────────

function shouldReplan(state: ArchitectState): 'planner' | 'finalizer' {
  if (
    state.critique?.overallAssessment === 'needs_revision' &&
    state.iteration < 2
  ) {
    return 'planner';
  }
  return 'finalizer';
}

// ─── Build Graph ─────────────────────────────────────────────────────────────

function buildArchitectGraph() {
  const graph = new StateGraph(ArchitectAnnotation)
    .addNode('planner', planNode)
    .addNode('critic', critiqueNode)
    .addNode('finalizer', finalizeNode)
    .addEdge('__start__', 'planner')
    .addEdge('planner', 'critic')
    .addConditionalEdges('critic', shouldReplan, {
      planner: 'planner',
      finalizer: 'finalizer',
    })
    .addEdge('finalizer', END);

  return graph.compile();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type ArchitectInput = {
  requirement: string;
  projectName?: string;
  projectDescription?: string;
  techStack?: string[];
  architecturalGuidelines?: string;
  existingTasks?: string;
  repoCodeContext?: string;
};

export type ArchitectResult = {
  tasks: ArchitectOutputType['tasks'];
  reasoning: string;
};

export async function runArchitectGraph(
  input: ArchitectInput
): Promise<ArchitectResult> {
  const app = buildArchitectGraph();

  const result = await app.invoke({
    requirement: input.requirement,
    projectName: input.projectName || '',
    projectDescription: input.projectDescription || '',
    techStack: input.techStack || [],
    architecturalGuidelines: input.architecturalGuidelines || '',
    existingTasks: input.existingTasks || '',
    repoCodeContext: input.repoCodeContext || '',
    plan: null,
    critique: null,
    iteration: 0,
    finalTasks: null,
  });

  if (!result.finalTasks) {
    throw new Error('Architect agent failed to produce final tasks');
  }

  return {
    tasks: result.finalTasks.tasks,
    reasoning: result.finalTasks.reasoning,
  };
}
