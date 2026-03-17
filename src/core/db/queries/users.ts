import { eq } from 'drizzle-orm';
import { db } from '../client';
import { users } from '../schema';
import type { User } from '../schema';

/**
 * Get a user by their ID.
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get a user by their email address.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

/**
 * Insert or update a user record (used during auth sync).
 */
export async function upsertUser(data: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<User> {
  const existing = await getUserById(data.id);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl ?? existing.avatarUrl,
      })
      .where(eq(users.id, data.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl ?? null,
    })
    .returning();

  return created;
}
