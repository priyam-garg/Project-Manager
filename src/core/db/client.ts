import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Please add it to your .env file.\n' +
      'Example: DATABASE_URL="postgresql://user:password@localhost:5432/nexus_db"'
  );
}

// Singleton pattern to prevent multiple connections in dev (Next.js hot reload)
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false, // Required for Supabase/PgBouncer transaction pool
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
