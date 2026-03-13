import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local if DATABASE_URL is not set (e.g. running standalone script)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Database connection configuration
const connectionString = process.env.DATABASE_URL || '';

// For development, we'll use a mock mode if no DATABASE_URL is provided
const isMockMode = !process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle>;

if (isMockMode) {
  // Mock mode for development without database
  console.warn('Running in mock mode - no DATABASE_URL provided');
  // Create a minimal client that won't actually connect
  const mockClient = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(mockClient, { schema });
} else {
  // Production mode with actual database connection
  const client = postgres(connectionString, {
    prepare: false, // Required for PgBouncer/Transaction Pool compatibility
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(client, { schema });
}

export { db };

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  if (isMockMode) {
    return true; // Always healthy in mock mode
  }

  try {
    // Simple query to check connection
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
