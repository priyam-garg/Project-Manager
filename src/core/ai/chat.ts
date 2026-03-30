import { getModel, type SupportedModelProvider } from './models';

export type ChatCompletionInput = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
  timeoutMs?: number;
};

export type ChatCompletionOutput = {
  content: string;
  provider: SupportedModelProvider;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  retryCount: number;
};

type ProviderResponse = {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('500')
  );
}

async function callOpenAIProvider(input: {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
}): Promise<ProviderResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          {
            role: 'system',
            content: input.systemPrompt || 'You are a helpful AI project management assistant.',
          },
          ...input.history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: input.message },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI response did not include assistant content.');
    }

    return {
      content,
      usage: {
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
        totalTokens: payload.usage?.total_tokens,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateChatCompletion(
  input: ChatCompletionInput
): Promise<ChatCompletionOutput> {
  const provider = (process.env.AI_PROVIDER?.toLowerCase() || 'openai') as SupportedModelProvider;
  const providerConfig = getModel(provider);

  if (!providerConfig.ready) {
    throw new Error(`AI provider ${provider} is not configured.`);
  }

  const timeoutMs = input.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS || 30000);
  const maxRetries = Number(process.env.AI_MAX_RETRIES || 2);
  const startedAt = Date.now();

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const result = await callOpenAIProvider({
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        baseUrl: providerConfig.baseUrl,
        timeoutMs,
        message: input.message,
        history: input.history,
        systemPrompt: input.systemPrompt,
      });

      return {
        content: result.content,
        provider,
        model: providerConfig.model,
        latencyMs: Date.now() - startedAt,
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
        totalTokens: result.usage?.totalTokens,
        retryCount: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown AI error');
      if (attempt >= maxRetries || !isTransientError(lastError)) {
        break;
      }

      await sleep(250 * 2 ** attempt);
      attempt += 1;
    }
  }

  throw new Error(lastError?.message || 'AI completion failed');
}
