'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Link as LinkIcon, Mail, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { MemberRole } from '@/core/db/schema';
import {
  createInviteAction,
  getMembersAction,
  getMyRoleAction,
  getPendingInvitationsAction,
  removeMemberAction,
  revokeInviteAction,
  type InvitationWithInviter,
  type MemberWithUser,
} from '../actions';

interface Props {
  projectId: string;
}

function roleBadgeVariant(role: MemberRole): 'default' | 'secondary' | 'outline' {
  if (role === 'owner') return 'default';
  if (role === 'admin') return 'secondary';
  return 'outline';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function MembersSection({ projectId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [myRole, setMyRole] = useState<MemberRole | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [invites, setInvites] = useState<InvitationWithInviter[]>([]);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [isSending, startSend] = useTransition();
  const [pendingAction, startAction] = useTransition();

  const canInvite = myRole === 'owner' || myRole === 'admin';

  const refresh = useCallback(async () => {
    const [roleRes, membersRes] = await Promise.all([
      getMyRoleAction(projectId),
      getMembersAction(projectId),
    ]);

    const role = roleRes.success ? roleRes.data ?? null : null;
    setMyRole(role);
    if (membersRes.success && membersRes.data) setMembers(membersRes.data);

    if (role === 'owner' || role === 'admin') {
      const invRes = await getPendingInvitationsAction(projectId);
      if (invRes.success && invRes.data) setInvites(invRes.data);
    } else {
      setInvites([]);
    }

    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startSend(async () => {
      const res = await createInviteAction({ projectId, email, role });
      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to send invitation');
        return;
      }
      toast.success('Invitation sent');
      setLastLink(res.data.acceptUrl);
      setEmail('');
      setRole('member');
      refresh();
    });
  }

  function handleRevoke(invitationId: string) {
    startAction(async () => {
      const res = await revokeInviteAction({ projectId, invitationId });
      if (!res.success) {
        toast.error(res.error || 'Failed to revoke');
        return;
      }
      toast.success('Invitation revoked');
      refresh();
    });
  }

  function handleRemoveMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return;
    startAction(async () => {
      const res = await removeMemberAction({ projectId, userId });
      if (!res.success) {
        toast.error(res.error || 'Failed to remove member');
        return;
      }
      toast.success('Member removed');
      refresh();
    });
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          People with access to this project. Owners and admins can invite others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canInvite && (
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email">Invite by email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as MemberRole)}
                  disabled={isSending || myRole !== 'owner'}
                >
                  <SelectTrigger id="invite-role" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSending}>
                <UserPlus className="h-4 w-4" />
                {isSending ? 'Sending…' : 'Send invite'}
              </Button>
            </div>

            {lastLink && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate font-mono text-xs">{lastLink}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => copyLink(lastLink)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Pending invites */}
        {canInvite && invites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pending invitations</h3>
            <ul className="divide-y rounded-md border">
              {invites.map((inv) => {
                const acceptUrl =
                  (typeof window !== 'undefined' ? window.location.origin : '') +
                  `/invite/${inv.token}`;
                return (
                  <li
                    key={inv.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{inv.invitedEmail}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.role} · expires{' '}
                        {inv.expiresAt instanceof Date
                          ? inv.expiresAt.toLocaleDateString()
                          : new Date(inv.expiresAt).toLocaleDateString()}
                        {inv.inviterName ? ` · by ${inv.inviterName}` : ''}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyLink(acceptUrl)}
                      title="Copy invite link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={pendingAction}
                      title="Revoke"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current members ({members.length})</h3>
          <ul className="divide-y rounded-md border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Avatar className="h-8 w-8">
                  {m.user.avatarUrl ? (
                    <AvatarImage src={m.user.avatarUrl} alt={m.user.name} />
                  ) : null}
                  <AvatarFallback>{initials(m.user.name || m.user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                </div>
                <Badge variant={roleBadgeVariant(m.role)} className="capitalize">
                  {m.role}
                </Badge>
                {canInvite && m.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                    disabled={pendingAction}
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
