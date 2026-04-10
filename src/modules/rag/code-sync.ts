import { createHash } from 'crypto';
import { getQdrantClient, ensureCodeCollection, CODE_COLLECTION_NAME } from './qdrant';
import { generateEmbedding } from '@/core/ai/embedding';

export type CodeChunkInput = {
  projectId: string;
  filepath: string;
  sha: string;
  chunkIndex: number;
  text: string;
  language?: string;
};

function chunkPointId(projectId: string, filepath: string, chunkIndex: number): string {
  // Qdrant requires UUID or unsigned int. Use deterministic UUIDv5-style hash.
  const hash = createHash('sha1')
    .update(`${projectId}:${filepath}:${chunkIndex}`)
    .digest('hex');
  // Format as UUID
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

export async function upsertCodeChunk(chunk: CodeChunkInput): Promise<void> {
  await ensureCodeCollection();
  const client = getQdrantClient();

  const vector = await generateEmbedding(chunk.text);

  await client.upsert(CODE_COLLECTION_NAME, {
    points: [
      {
        id: chunkPointId(chunk.projectId, chunk.filepath, chunk.chunkIndex),
        vector,
        payload: {
          project_id: chunk.projectId,
          filepath: chunk.filepath,
          sha: chunk.sha,
          chunk_index: chunk.chunkIndex,
          language: chunk.language ?? '',
          text: chunk.text,
        },
      },
    ],
  });
}

export async function deleteCodeChunksByFile(
  projectId: string,
  filepath: string
): Promise<void> {
  await ensureCodeCollection();
  const client = getQdrantClient();
  await client.delete(CODE_COLLECTION_NAME, {
    filter: {
      must: [
        { key: 'project_id', match: { value: projectId } },
        { key: 'filepath', match: { value: filepath } },
      ],
    },
  });
}

export async function deleteAllCodeChunks(projectId: string): Promise<void> {
  await ensureCodeCollection();
  const client = getQdrantClient();
  await client.delete(CODE_COLLECTION_NAME, {
    filter: {
      must: [{ key: 'project_id', match: { value: projectId } }],
    },
  });
}
