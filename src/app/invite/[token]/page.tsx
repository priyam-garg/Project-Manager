import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getOptionalAuthUser } from '@/core/auth';
import { acceptInvitation, getInvitationByToken } from '@/core/db/queries';
import { db } from '@/core/db/client';
import { projects, users } from '@/core/db/schema';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getInvitationByToken(token);

  if (!invite) {
    return (
      <Shell title="Invitation not found">
        <p className="text-muted-foreground">
          This invitation link is invalid. It may have been mistyped or the
          invitation may no longer exist.
        </p>
      </Shell>
    );
  }

  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, invite.projectId))
    .limit(1);

  const projectName = project?.name ?? 'this project';

  if (invite.status !== 'pending') {
    return (
      <Shell title="Invitation unavailable">
        <p className="text-muted-foreground">
          This invitation is <strong>{invite.status}</strong> and can no longer
          be accepted. Ask a project admin to send a new one.
        </p>
      </Shell>
    );
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    return (
      <Shell title="Invitation expired">
        <p className="text-muted-foreground">
          This invitation expired on {invite.expiresAt.toLocaleDateString()}.
          Ask a project admin to send a new one.
        </p>
      </Shell>
    );
  }

  const [inviter] = invite.invitedByUserId
    ? await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, invite.invitedByUserId))
        .limit(1)
    : [];

  const me = await getOptionalAuthUser();
  const nextUrl = `/invite/${token}`;

  // Signed out — bounce via sign-in / sign-up.
  if (!me) {
    const signInHref = `/sign-in?next=${encodeURIComponent(nextUrl)}`;
    const signUpHref = `/sign-up?next=${encodeURIComponent(nextUrl)}&email=${encodeURIComponent(invite.invitedEmail)}`;

    return (
      <Shell title={`Join ${projectName}`}>
        <p className="text-muted-foreground">
          {inviter?.name ? <strong>{inviter.name}</strong> : 'Someone'} invited{' '}
          <strong>{invite.invitedEmail}</strong> to collaborate on{' '}
          <strong>{projectName}</strong> as a <em>{invite.role}</em>.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={signInHref} className={buttonClass('default', 'flex-1')}>
            Sign in to accept
          </Link>
          <Link href={signUpHref} className={buttonClass('outline', 'flex-1')}>
            Create an account
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Expires {invite.expiresAt.toLocaleDateString()}.
        </p>
      </Shell>
    );
  }

  // Signed in but email does not match the invitation target.
  if (me.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
    return (
      <Shell title="Wrong account">
        <p className="text-muted-foreground">
          This invitation was sent to{' '}
          <strong>{invite.invitedEmail}</strong>, but you are signed in as{' '}
          <strong>{me.email}</strong>. Sign out and sign in with the invited
          email to accept, or ask the project admin to re-send the invite to
          your current email.
        </p>
        <Link href="/dashboard" className={buttonClass('outline')}>
          Go to dashboard
        </Link>
      </Shell>
    );
  }

  // Signed in with matching email — accept and go to the board.
  const projectId = await acceptInvitation(invite.id, me.id);
  if (!projectId) {
    return (
      <Shell title="Invitation unavailable">
        <p className="text-muted-foreground">
          This invitation could not be accepted. It may have just expired or
          been revoked.
        </p>
      </Shell>
    );
  }

  redirect(`/projects/${projectId}/board`);
}

function buttonClass(variant: 'default' | 'outline', extra?: string): string {
  return cn(
    'inline-flex items-center justify-center rounded-md h-10 px-4 py-2 text-sm font-medium transition-colors',
    variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'outline' &&
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    extra,
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-lg border border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
