'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import type { ApiResponse } from '@/types';
import type { MemberRole, ProjectInvitation, ProjectMember, User } from '@/core/db/schema';
import { getAuthUser, requireRole } from '@/core/auth';
import { db } from '@/core/db/client';
import { projectInvitations, projectMembers, projects, users } from '@/core/db/schema';
import {
  createInvitation,
  getPendingInvitationsForProject,
  revokeInvitation as dbRevokeInvitation,
  removeProjectMember as dbRemoveProjectMember,
} from '@/core/db/queries';
import { sendInviteEmail } from './email';

function baseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  );
}

export type InvitationWithInviter = ProjectInvitation & {
  inviterName: string | null;
};

export type MemberWithUser = ProjectMember & {
  user: Pick<User, 'id' | 'email' | 'name' | 'avatarUrl'>;
};

export async function getMembersAction(
  projectId: string,
): Promise<ApiResponse<MemberWithUser[]>> {
  try {
    const me = await getAuthUser();
    await requireRole(me.id, projectId, 'member');

    const rows = await db
      .select({
        member: projectMembers,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return {
      success: true,
      data: rows.map((r) => ({ ...r.member, user: r.user })),
    };
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return { success: false, error: 'Failed to fetch members' };
  }
}

export async function getPendingInvitationsAction(
  projectId: string,
): Promise<ApiResponse<InvitationWithInviter[]>> {
  try {
    const me = await getAuthUser();
    await requireRole(me.id, projectId, 'admin');

    const invites = await getPendingInvitationsForProject(projectId);
    if (invites.length === 0) return { success: true, data: [] };

    const inviterIds = Array.from(
      new Set(invites.map((i) => i.invitedByUserId).filter((v): v is string => !!v)),
    );

    const nameById = new Map<string, string>();
    if (inviterIds.length > 0) {
      const inviterRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, inviterIds));
      for (const u of inviterRows) nameById.set(u.id, u.name);
    }

    return {
      success: true,
      data: invites.map((i) => ({
        ...i,
        inviterName: i.invitedByUserId ? nameById.get(i.invitedByUserId) ?? null : null,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch pending invitations:', error);
    return { success: false, error: 'Failed to fetch invitations' };
  }
}

export async function createInviteAction(input: {
  projectId: string;
  email: string;
  role?: MemberRole;
}): Promise<ApiResponse<{ invitationId: string; acceptUrl: string }>> {
  try {
    const me = await getAuthUser();
    await requireRole(me.id, input.projectId, 'admin');

    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Reject if email already belongs to a current member.
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      const [existingMember] = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, existingUser.id),
          ),
        )
        .limit(1);

      if (existingMember) {
        return { success: false, error: 'That user is already a member of this project' };
      }
    }

    // Revoke any other pending invites for the same (project, email) pair
    // so each invite email always has exactly one live token.
    await db
      .update(projectInvitations)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(projectInvitations.projectId, input.projectId),
          eq(projectInvitations.invitedEmail, email),
          eq(projectInvitations.status, 'pending'),
        ),
      );

    const role: MemberRole = input.role ?? 'member';
    if (role === 'owner') {
      return { success: false, error: 'Cannot invite as owner' };
    }

    const invite = await createInvitation({
      projectId: input.projectId,
      invitedEmail: email,
      invitedByUserId: me.id,
      role,
    });

    const [project] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);

    const [inviter] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, me.id))
      .limit(1);

    const acceptUrl = `${baseUrl()}/invite/${invite.token}`;

    after(() =>
      sendInviteEmail({
        to: email,
        inviterName: inviter?.name || 'A teammate',
        projectName: project?.name || 'a project',
        acceptUrl,
        expiresAt: invite.expiresAt,
      }).catch((e) => console.error('Invite email failed:', e)),
    );

    revalidatePath(`/projects/${input.projectId}/settings`);
    return { success: true, data: { invitationId: invite.id, acceptUrl } };
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return { success: false, error: 'Failed to create invitation' };
  }
}

export async function revokeInviteAction(input: {
  projectId: string;
  invitationId: string;
}): Promise<ApiResponse<void>> {
  try {
    const me = await getAuthUser();
    await requireRole(me.id, input.projectId, 'admin');

    const [invite] = await db
      .select({ id: projectInvitations.id, projectId: projectInvitations.projectId })
      .from(projectInvitations)
      .where(eq(projectInvitations.id, input.invitationId))
      .limit(1);

    if (!invite || invite.projectId !== input.projectId) {
      return { success: false, error: 'Invitation not found' };
    }

    await dbRevokeInvitation(input.invitationId);
    revalidatePath(`/projects/${input.projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    return { success: false, error: 'Failed to revoke invitation' };
  }
}

export async function removeMemberAction(input: {
  projectId: string;
  userId: string;
}): Promise<ApiResponse<void>> {
  try {
    const me = await getAuthUser();
    await requireRole(me.id, input.projectId, 'admin');

    if (input.userId === me.id) {
      return { success: false, error: 'You cannot remove yourself' };
    }

    const [target] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, input.userId),
        ),
      )
      .limit(1);

    if (!target) {
      return { success: false, error: 'Member not found' };
    }
    if (target.role === 'owner') {
      return { success: false, error: 'Cannot remove the project owner' };
    }

    await dbRemoveProjectMember(input.projectId, input.userId);
    revalidatePath(`/projects/${input.projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}

export async function getMyRoleAction(
  projectId: string,
): Promise<ApiResponse<MemberRole | null>> {
  try {
    const me = await getAuthUser();
    const [row] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, me.id),
        ),
      )
      .limit(1);
    return { success: true, data: row?.role ?? null };
  } catch (error) {
    console.error('Failed to fetch my role:', error);
    return { success: false, error: 'Failed to fetch role' };
  }
}
