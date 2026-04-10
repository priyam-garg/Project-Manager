'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Github, RefreshCw, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import {
  getConnectionStatus,
  disconnectGithub,
  triggerReindex,
  type ConnectionStatus,
} from '../actions';
import { RepoPicker } from './repo-picker';

interface Props {
  projectId: string;
}

export function GithubSettingsSection({ projectId }: Props) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const res = await getConnectionStatus(projectId);
    if (res.success && res.data) setStatus(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [projectId]);

  function handleConnect() {
    window.location.href = `/api/auth/github/start?projectId=${projectId}`;
  }

  function handleDisconnect() {
    if (!confirm('Disconnect GitHub? This will remove all indexed code chunks for this project.')) return;
    startTransition(async () => {
      const res = await disconnectGithub(projectId);
      if (res.success) {
        toast.success('GitHub disconnected');
        refresh();
      } else {
        toast.error(res.error || 'Failed to disconnect');
      }
    });
  }

  function handleReindex() {
    startTransition(async () => {
      toast.info('Reindexing repository...');
      const res = await triggerReindex(projectId);
      if (res.success && res.data) {
        toast.success(`Reindexed ${res.data.filesIndexed} files (${res.data.chunksIndexed} chunks)`);
        refresh();
      } else {
        toast.error(res.error || 'Reindex failed');
      }
    });
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Github className="h-6 w-6" />
        <div>
          <h2 className="text-lg font-semibold">GitHub Integration</h2>
          <p className="text-sm text-muted-foreground">
            Connect a repository so the chat and agent can use your code as context, and commits can auto-close tasks.
          </p>
        </div>
      </div>

      {!status?.connected && (
        <div>
          <Button onClick={handleConnect} className="gap-2">
            <Github className="h-4 w-4" />
            Connect GitHub
          </Button>
        </div>
      )}

      {status?.connected && !status.hasRepo && (
        <div className="space-y-4">
          <div className="text-sm">
            Connected as <span className="font-medium">@{status.githubUserLogin}</span>. Pick a repository to index:
          </div>
          <RepoPicker projectId={projectId} onSelected={refresh} />
          <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isPending}>
            Disconnect
          </Button>
        </div>
      )}

      {status?.connected && status.hasRepo && (
        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <div>
              Repository: <span className="font-mono">{status.repoFullName}</span>
            </div>
            <div className="text-muted-foreground">
              Branch: {status.defaultBranch} · Connected as @{status.githubUserLogin}
            </div>
            {status.lastIndexedAt && (
              <div className="text-muted-foreground">
                Last indexed: {new Date(status.lastIndexedAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReindex} disabled={isPending} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Reindex
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isPending} className="gap-2">
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
