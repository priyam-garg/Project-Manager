'use server';

import type { ChatMessage, ApiResponse } from '@/types';
import { getAuthUser, requireRole } from '@/core/auth';
import {
  getChatMessages as dbGetChatMessages,
  saveChatMessage,
  clearChatHistory as dbClearChatHistory,
  consumeChatRateLimit,
} from '@/core/db/queries';
import { generateChatCompletion } from '@/core/ai/chat';
import { retrieveRelevantTasks } from '@/modules/rag/retriever';

const RATE_LIMIT_PER_WINDOW = Number(process.env.CHAT_RATE_LIMIT_REQUESTS || 20);
const RATE_LIMIT_WINDOW_MINUTES = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MINUTES || 1);

function toClientError(error: unknown): string {
  if (!(error instanceof Error)) return 'Failed to send message';
  if (error.message.includes('Rate limit exceeded')) {
    return 'Rate limit exceeded. Please wait and try again.';
  }
  if (error.message.toLowerCase().includes('timeout')) {
    return 'The AI service timed out. Please try again.';
  }
  return 'Failed to send message';
}

/**
 * Send a user message and get an AI response.
 * User message and AI response are both persisted to the database.
 * AI response is still mock for now (AI integration is a separate feature).
 */
export async function sendChatMessage(
  projectId: string,
  message: string
): Promise<ApiResponse<ChatMessage>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'member');

    const rateLimit = await consumeChatRateLimit({
      userId: user.id,
      projectId,
      limit: RATE_LIMIT_PER_WINDOW,
      windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded');
    }

    const history = await dbGetChatMessages(projectId);
    const historyForModel = history
      .filter((msg) => msg.id)
      .slice(-20)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    // Save user message to DB
    await saveChatMessage({
      projectId,
      userId: user.id,
      role: 'user',
      content: message,
    });

    // Inject full board state — all tasks grouped by status for accurate analysis
    let systemPrompt = `You are a helpful AI project management assistant. You have full visibility into this project's board, implementation plan, and metrics. When asked what to work on next, analyze task dependencies, priorities, and the roadmap to give specific, actionable advice. Always use the real data provided below — never guess or hallucinate task names.`;
    try {
      const { getTasksByProject } = await import('@/core/db/queries/tasks');
      const allTasks = await getTasksByProject(projectId);

      if (allTasks.length > 0) {
        const byStatus: Record<string, typeof allTasks> = {
          done: [],
          in_progress: [],
          todo: [],
          backlog: [],
        };
        for (const t of allTasks) {
          (byStatus[t.status] ?? byStatus.backlog).push(t);
        }

        const formatTasks = (list: typeof allTasks) =>
          list
            .map(
              (t) =>
                `  - [${t.priority}] ${t.title}${t.description ? ` — ${t.description.slice(0, 120)}` : ''}`
            )
            .join('\n');

        const boardLines: string[] = [
          `Total: ${allTasks.length} tasks | Done: ${byStatus.done.length} | In Progress: ${byStatus.in_progress.length} | Todo: ${byStatus.todo.length} | Backlog: ${byStatus.backlog.length}`,
          `Completion rate: ${allTasks.length > 0 ? Math.round((byStatus.done.length / allTasks.length) * 100) : 0}%`,
        ];

        if (byStatus.done.length > 0) {
          boardLines.push(`\n✅ DONE (${byStatus.done.length}):\n${formatTasks(byStatus.done)}`);
        }
        if (byStatus.in_progress.length > 0) {
          boardLines.push(`\n🔄 IN PROGRESS (${byStatus.in_progress.length}):\n${formatTasks(byStatus.in_progress)}`);
        }
        if (byStatus.todo.length > 0) {
          boardLines.push(`\n📋 TODO (${byStatus.todo.length}):\n${formatTasks(byStatus.todo)}`);
        }
        if (byStatus.backlog.length > 0) {
          boardLines.push(`\n📥 BACKLOG (${byStatus.backlog.length}):\n${formatTasks(byStatus.backlog)}`);
        }

        systemPrompt += `\n\n=== PROJECT BOARD (complete, live data) ===\n${boardLines.join('\n')}`;
      }
    } catch (err) {
      console.warn('Failed to fetch board state for chat context:', err);

      // Fallback to RAG semantic search if full board fetch fails
      try {
        const relevantTasks = await retrieveRelevantTasks(message, { projectId });
        if (relevantTasks.length > 0) {
          const taskContext = relevantTasks
            .map(
              (t) =>
                `- [${t.status}/${t.priority}] ${t.title}${t.description ? `: ${t.description}` : ''}`
            )
            .join('\n');
          systemPrompt += `\n\nRelevant tasks from this project:\n${taskContext}`;
        }
      } catch (ragErr) {
        console.warn('RAG retrieval also failed:', ragErr);
      }
    }

    // RAG: retrieve relevant plan sections for context
    try {
      const { retrieveRelevantPlanSections } = await import('@/modules/rag/plan-retriever');
      const planSections = await retrieveRelevantPlanSections(message, projectId);
      if (planSections.length > 0) {
        const planContext = planSections
          .map((s) => `[${s.phase} / ${s.sectionType}] ${s.content}`)
          .join('\n');
        systemPrompt += `\n\n=== IMPLEMENTATION PLAN (relevant sections) ===\n${planContext}\n\nWhen suggesting next tasks, cross-reference the board with the roadmap phases. Suggest tasks that align with the current phase and unblock progress.`;
      }
    } catch (err) {
      console.warn('Plan RAG retrieval failed, continuing without plan context:', err);
    }

    // RAG: retrieve relevant code chunks from connected GitHub repo
    try {
      const { retrieveRelevantCodeChunks } = await import('@/modules/rag/code-retriever');
      const codeChunks = await retrieveRelevantCodeChunks(message, { projectId }, 6);
      if (codeChunks.length > 0) {
        const codeContext = codeChunks
          .map((c) => `--- ${c.filepath} ---\n${c.text}`)
          .join('\n\n');
        systemPrompt += `\n\n=== RELEVANT CODE FROM CONNECTED GITHUB REPO ===\n${codeContext}\n\nUse these code excerpts to give precise, file-specific answers. Cite filepaths when referring to code.`;
      }
    } catch (err) {
      console.warn('Code RAG retrieval failed, continuing without code context:', err);
    }



    let completion;
    try {
      completion = await generateChatCompletion({
        message,
        history: historyForModel,
        systemPrompt,
      });
    } catch (error) {
      const fallback = 'I could not generate a response right now. Please try again in a moment.';
      const assistantErrorMsg = await saveChatMessage({
        projectId,
        userId: null,
        role: 'assistant',
        content: fallback,
        metrics: {
          provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
          model: process.env.OPENAI_CHAT_MODEL || 'unknown',
          prompt: message,
          response: fallback,
          latencyMs: 0,
          retryCount: Number(process.env.AI_MAX_RETRIES || 2),
          errorStatus: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        },
      });

      return {
        success: false,
        error: toClientError(error),
        data: {
          id: assistantErrorMsg.id,
          role: 'assistant',
          content: assistantErrorMsg.content,
          timestamp: assistantErrorMsg.createdAt,
        },
      };
    }

    // Save AI response and telemetry to DB
    const assistantMsg = await saveChatMessage({
      projectId,
      userId: null,
      role: 'assistant',
      content: completion.content,
      metrics: {
        provider: completion.provider,
        model: completion.model,
        prompt: message,
        response: completion.content,
        latencyMs: completion.latencyMs,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        totalTokens: completion.totalTokens,
        retryCount: completion.retryCount,
        errorStatus: false,
      },
    });

    console.info('chat_completion', {
      projectId,
      userId: user.id,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
      totalTokens: completion.totalTokens,
      retryCount: completion.retryCount,
    });

    return {
      success: true,
      data: {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        timestamp: assistantMsg.createdAt,
      },
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, error: toClientError(error) };
  }
}

/**
 * Load chat history for a project from the database.
 */
export async function loadChatHistory(
  projectId: string
): Promise<ApiResponse<ChatMessage[]>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'member');
    const messages = await dbGetChatMessages(projectId);

    const chatMessages: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));

    return { success: true, data: chatMessages };
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return { success: false, error: 'Failed to load chat history' };
  }
}

/**
 * Clear all chat history for a project.
 */
export async function clearChat(projectId: string): Promise<ApiResponse<void>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'admin');
    await dbClearChatHistory(projectId);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear chat:', error);
    return { success: false, error: 'Failed to clear chat' };
  }
}
