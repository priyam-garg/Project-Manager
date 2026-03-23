export type SupportedModelProvider = "openai" | "anthropic" | "gemini";

type ModelConfig = {
  provider: SupportedModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  ready: boolean;
};

export function getModel(provider: SupportedModelProvider) {
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || '';
    return {
      provider,
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey,
      ready: Boolean(apiKey),
    } satisfies ModelConfig;
  }

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || '';
    return {
      provider,
      model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash',
      baseUrl:
        process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey,
      ready: Boolean(apiKey),
    } satisfies ModelConfig;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  return {
    provider,
    model: process.env.ANTHROPIC_CHAT_MODEL || 'claude-3-5-sonnet-latest',
    baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
    apiKey,
    ready: false,
  } satisfies ModelConfig;
}
