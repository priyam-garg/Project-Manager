export function buildTaskEmbeddingText(task: {
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  tags?: string[];
}): string {
  const parts = [task.title];
  if (task.description) parts.push(task.description);
  parts.push(`Status: ${task.status}`, `Priority: ${task.priority}`);
  if (task.tags?.length) parts.push(`Tags: ${task.tags.join(', ')}`);
  return parts.join('\n');
}

export async function generateEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = process.env.EMBEDDING_MODEL || 'text-embedding-004';
  const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input, model }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return payload.data[0].embedding;
}
