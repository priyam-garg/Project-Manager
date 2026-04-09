import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'tasks';
const ROADMAP_COLLECTION_NAME = 'roadmap';
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

export async function ensureRoadmapCollection(): Promise<void> {
  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === ROADMAP_COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(ROADMAP_COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });

    await client.createPayloadIndex(ROADMAP_COLLECTION_NAME, {
      field_name: 'project_id',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(ROADMAP_COLLECTION_NAME, {
      field_name: 'phase',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(ROADMAP_COLLECTION_NAME, {
      field_name: 'section_type',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(ROADMAP_COLLECTION_NAME, {
      field_name: 'version',
      field_schema: 'integer',
    });
  }
}

export { COLLECTION_NAME, ROADMAP_COLLECTION_NAME };

