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

  const model = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';

  // Use the native Gemini embedContent endpoint (v1beta for newer models)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: input }] },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    embedding: { values: number[] };
  };

  return payload.embedding.values;
}
