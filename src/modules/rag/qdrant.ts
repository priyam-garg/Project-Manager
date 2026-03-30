import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'tasks';
const VECTOR_SIZE = Number(process.env.EMBEDDING_DIMENSIONS || 768);

const globalForQdrant = globalThis as unknown as { qdrantClient?: QdrantClient };

export function getQdrantClient(): QdrantClient {
  if (!globalForQdrant.qdrantClient) {
    globalForQdrant.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY || undefined,
    });
  }
  return globalForQdrant.qdrantClient;
}

export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });

    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'project_id',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'status',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'priority',
      field_schema: 'keyword',
    });
  }
}

export { COLLECTION_NAME };
