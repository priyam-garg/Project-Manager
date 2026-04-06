import { z } from 'zod';

// ─── Individual Task Schema ──────────────────────────────────────────────────

export const TaskSchema = z.object({
  title: z.string().describe('Concise, action-oriented task title (max 80 chars)'),
  description: z
    .string()
    .describe(
      'Detailed description of what needs to be done, including acceptance criteria'
    ),
  priority: z
    .enum(['low', 'medium', 'high'])
    .describe('Priority based on impact and urgency'),
  storyPoints: z
    .number()
    .int()
    .min(1)
    .max(13)
    .describe('Fibonacci story points estimate (1, 2, 3, 5, 8, 13)'),
  tags: z
    .array(z.string())
    .describe('Relevant tags, e.g. ["backend", "api", "auth"]'),
});

export type TaskSchemaType = z.infer<typeof TaskSchema>;

// ─── Full Architect Output ───────────────────────────────────────────────────

export const ArchitectOutputSchema = z.object({
  tasks: z
    .array(TaskSchema)
    .min(1)
    .describe('Ordered list of tasks that fully implement the requirement'),
  reasoning: z
    .string()
    .describe(
      'Architectural reasoning: why these tasks, in this order, with these priorities'
    ),
});

export type ArchitectOutputType = z.infer<typeof ArchitectOutputSchema>;

// ─── Critique Schema ─────────────────────────────────────────────────────────

export const CritiqueSchema = z.object({
  issues: z
    .array(
      z.object({
        severity: z.enum(['minor', 'major']).describe('How serious this gap is'),
        description: z.string().describe('What is missing or wrong'),
        suggestion: z.string().describe('How to fix it'),
      })
    )
    .describe('List of issues found in the plan'),
  overallAssessment: z
    .enum(['acceptable', 'needs_revision'])
    .describe('Whether the plan needs another iteration'),
});

export type CritiqueType = z.infer<typeof CritiqueSchema>;
