'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { listUserRepos, selectRepo, type RepoSummary } from '../actions';

interface Props {
  projectId: string;
  onSelected: () => void;
}

export function RepoPicker({ projectId, onSelected }: Props) {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const res = await listUserRepos(projectId);
      if (res.success && res.data) setRepos(res.data);
      else toast.error(res.error || 'Failed to load repositories');
      setIsLoading(false);
    })();
  }, [projectId]);

  function handleSelect(repo: RepoSummary) {
    if (!confirm(`Index "${repo.fullName}"? This may take a few minutes.`)) return;
    startTransition(async () => {
      toast.info(`Indexing ${repo.fullName}...`);
      const res = await selectRepo(projectId, repo.owner, repo.name);
      if (res.success && res.data) {
        toast.success(
          `Indexed ${res.data.filesIndexed} files (${res.data.chunksIndexed} chunks). ${res.data.tasksAutoClosed} tasks auto-closed from recent commits.`
        );
        onSelected();
      } else {
        toast.error(res.error || 'Failed to connect repository');
      }
    });
  }

  const filtered = repos.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading repositories...</div>;
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No repositories found.</div>
        )}
        {filtered.map((repo) => (
          <div key={repo.fullName} className="flex items-center justify-between p-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium font-mono text-sm truncate">
                {repo.fullName}
                {repo.private && (
                  <span className="ml-2 text-xs text-muted-foreground">(private)</span>
                )}
              </div>
              {repo.description && (
                <div className="text-xs text-muted-foreground truncate">{repo.description}</div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSelect(repo)}
              disabled={isPending}
            >
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
