import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { projectMembers } from '../db/schema';
import type { MemberRole } from '../db/schema';

const ROLE_RANK: Record<MemberRole, number> = {
  member: 0,
  admin: 1,
  owner: 2,
};

export async function getMembership(
  userId: string,
  projectId: string,
): Promise<MemberRole | null> {
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  return row?.role ?? null;
}

export function hasRole(actual: MemberRole | null, min: MemberRole): boolean {
  if (!actual) return false;
  return ROLE_RANK[actual] >= ROLE_RANK[min];
}

export async function requireRole(
  userId: string,
  projectId: string,
  min: MemberRole,
): Promise<MemberRole> {
  const role = await getMembership(userId, projectId);
  if (!hasRole(role, min)) {
    throw new Error('Forbidden: insufficient project permissions.');
  }
  return role!;
}
