export type SupportedModelProvider = "openai" | "anthropic";

export function getModel(provider: SupportedModelProvider) {
  return {
    provider,
    ready: false,
  };
}
