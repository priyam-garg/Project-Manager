import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../client';
import { projectInvitations, projectMembers } from '../schema';
import type { MemberRole, ProjectInvitation } from '../schema';

const EXPIRY_DAYS = 7;

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function createInvitation(data: {
  projectId: string;
  invitedEmail: string;
  invitedByUserId: string;
  role?: MemberRole;
}): Promise<ProjectInvitation> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const [row] = await db
    .insert(projectInvitations)
    .values({
      id: generateId(),
      projectId: data.projectId,
      invitedEmail: data.invitedEmail.toLowerCase(),
      invitedByUserId: data.invitedByUserId,
      role: data.role ?? 'member',
      token: generateToken(),
      status: 'pending',
      expiresAt,
      createdAt: now,
    })
    .returning();

  return row;
}

export async function getInvitationByToken(token: string): Promise<ProjectInvitation | null> {
  const [row] = await db
    .select()
    .from(projectInvitations)
    .where(eq(projectInvitations.token, token))
    .limit(1);
  return row ?? null;
}

export async function getPendingInvitationsForProject(
  projectId: string,
): Promise<ProjectInvitation[]> {
  return db
    .select()
    .from(projectInvitations)
    .where(
      and(
        eq(projectInvitations.projectId, projectId),
        eq(projectInvitations.status, 'pending'),
      ),
    )
    .orderBy(desc(projectInvitations.createdAt));
}

export async function getPendingInvitationsForEmail(
  email: string,
): Promise<ProjectInvitation[]> {
  return db
    .select()
    .from(projectInvitations)
    .where(
      and(
        eq(projectInvitations.invitedEmail, email.toLowerCase()),
        eq(projectInvitations.status, 'pending'),
      ),
    );
}

export async function revokeInvitation(id: string): Promise<void> {
  await db
    .update(projectInvitations)
    .set({ status: 'revoked' })
    .where(eq(projectInvitations.id, id));
}

export async function markInvitationAccepted(id: string): Promise<void> {
  await db
    .update(projectInvitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(projectInvitations.id, id));
}

/**
 * Accept a single invitation for an authenticated user.
 * - Adds a project_members row (or keeps existing higher role).
 * - Marks the invitation accepted.
 * Returns the projectId joined, or null if the invitation was not acceptable.
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string,
): Promise<string | null> {
  const [invite] = await db
    .select()
    .from(projectInvitations)
    .where(eq(projectInvitations.id, invitationId))
    .limit(1);

  if (!invite) return null;
  if (invite.status !== 'pending') return null;
  if (invite.expiresAt.getTime() < Date.now()) {
    await db
      .update(projectInvitations)
      .set({ status: 'expired' })
      .where(eq(projectInvitations.id, invitationId));
    return null;
  }

  const [existingMember] = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, invite.projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!existingMember) {
    await db.insert(projectMembers).values({
      id: generateId(),
      projectId: invite.projectId,
      userId,
      role: invite.role,
    });
  }

  await db
    .update(projectInvitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(projectInvitations.id, invitationId));

  return invite.projectId;
}

/**
 * Called after a new user signs up with `email`. Accepts all pending
 * invitations addressed to that email. Safe to call even if none exist.
 */
export async function claimPendingInvitations(
  userId: string,
  email: string,
): Promise<string[]> {
  const pending = await getPendingInvitationsForEmail(email);
  if (pending.length === 0) return [];

  const now = new Date();
  const valid = pending.filter((i) => i.expiresAt.getTime() > now.getTime());
  const expired = pending.filter((i) => i.expiresAt.getTime() <= now.getTime());

  if (expired.length > 0) {
    await db
      .update(projectInvitations)
      .set({ status: 'expired' })
      .where(
        inArray(
          projectInvitations.id,
          expired.map((i) => i.id),
        ),
      );
  }

  const joinedProjectIds: string[] = [];

  for (const invite of valid) {
    const [existing] = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, invite.projectId),
          eq(projectMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(projectMembers).values({
        id: generateId(),
        projectId: invite.projectId,
        userId,
        role: invite.role,
      });
    }

    await db
      .update(projectInvitations)
      .set({ status: 'accepted', acceptedAt: now })
      .where(eq(projectInvitations.id, invite.id));

    joinedProjectIds.push(invite.projectId);
  }

  return joinedProjectIds;
}

export async function getProjectMembers(projectId: string) {
  return db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    );
}
