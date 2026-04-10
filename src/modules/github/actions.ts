'use server';

import { db } from '@/core/db/client';
import { githubConnections } from '@/core/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/core/auth';
import { createOctokit } from './lib/octokit';
import { indexRepo } from './lib/indexer';
import { matchCommitToTasks } from './lib/commit-matcher';
import { deleteAllCodeChunks } from '@/modules/rag/code-sync';
import { updateTask } from '@/core/db/queries/tasks';
import type { ApiResponse } from '@/types';

export type ConnectionStatus = {
  connected: boolean;
  hasRepo: boolean;
  githubUserLogin?: string;
  repoFullName?: string;
  defaultBranch?: string;
  lastIndexedAt?: Date | null;
};

export async function getConnectionStatus(
  projectId: string
): Promise<ApiResponse<ConnectionStatus>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));

    if (!conn) {
      return { success: true, data: { connected: false, hasRepo: false } };
    }

    return {
      success: true,
      data: {
        connected: true,
        hasRepo: !!conn.repoFullName,
        githubUserLogin: conn.githubUserLogin,
        repoFullName: conn.repoFullName ?? undefined,
        defaultBranch: conn.defaultBranch ?? undefined,
        lastIndexedAt: conn.lastIndexedAt,
      },
    };
  } catch (error) {
    console.error('Failed to get GitHub connection status:', error);
    return { success: false, error: 'Failed to load connection status' };
  }
}

export type RepoSummary = {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  updatedAt: string | null;
};

export async function listUserRepos(
  projectId: string
): Promise<ApiResponse<RepoSummary[]>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));
    if (!conn) return { success: false, error: 'GitHub not connected' };

    const octokit = createOctokit(conn.accessToken);
    const res = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    const repos: RepoSummary[] = res.data.map((r) => ({
      owner: r.owner.login,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      private: r.private,
      defaultBranch: r.default_branch,
      updatedAt: r.updated_at ?? null,
    }));

    return { success: true, data: repos };
  } catch (error) {
    console.error('Failed to list repos:', error);
    return { success: false, error: 'Failed to list repositories' };
  }
}

export async function selectRepo(
  projectId: string,
  owner: string,
  name: string
): Promise<ApiResponse<{ filesIndexed: number; chunksIndexed: number; tasksAutoClosed: number }>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));
    if (!conn) return { success: false, error: 'GitHub not connected' };

    const octokit = createOctokit(conn.accessToken);
    const repoRes = await octokit.repos.get({ owner, repo: name });
    const repo = repoRes.data;

    // Register webhook (best effort)
    let webhookId: number | null = null;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    const appBaseUrl = process.env.APP_BASE_URL || '';
    if (webhookSecret && appBaseUrl) {
      try {
        const hookRes = await octokit.repos.createWebhook({
          owner,
          repo: name,
          config: {
            url: `${appBaseUrl}/api/webhooks/github`,
            content_type: 'json',
            secret: webhookSecret,
            insecure_ssl: '0',
          },
          events: ['push'],
          active: true,
        });
        webhookId = hookRes.data.id;
      } catch (err) {
        console.warn('[github] Failed to create webhook (continuing without):', err);
      }
    } else {
      console.warn(
        '[github] APP_BASE_URL or GITHUB_WEBHOOK_SECRET not set — skipping webhook registration'
      );
    }

    await db
      .update(githubConnections)
      .set({
        repoOwner: owner,
        repoName: name,
        repoFullName: repo.full_name,
        defaultBranch: repo.default_branch,
        webhookId,
        updatedAt: new Date(),
      })
      .where(eq(githubConnections.projectId, projectId));

    // Initial index
    const indexResult = await indexRepo(projectId);

    // Backfill: scan recent commits and AI-match
    let tasksAutoClosed = 0;
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const commits = await octokit.repos.listCommits({
        owner,
        repo: name,
        since,
        per_page: 100,
      });

      const user = await getAuthUser();
      const closedSet = new Set<string>();

      for (const c of commits.data) {
        try {
          const detail = await octokit.repos.getCommit({
            owner,
            repo: name,
            ref: c.sha,
          });
          const filesChanged = (detail.data.files || []).map((f) => f.filename);
          const matched = await matchCommitToTasks({
            projectId,
            commitMessage: c.commit.message,
            filesChanged,
          });
          for (const taskId of matched) {
            if (closedSet.has(taskId)) continue;
            await updateTask(taskId, { status: 'done' }, user.id);
            closedSet.add(taskId);
          }
        } catch (err) {
          console.warn('[github] Backfill commit failed:', err);
        }
      }
      tasksAutoClosed = closedSet.size;
    } catch (err) {
      console.warn('[github] Commit backfill failed:', err);
    }

    return {
      success: true,
      data: {
        filesIndexed: indexResult.filesIndexed,
        chunksIndexed: indexResult.chunksIndexed,
        tasksAutoClosed,
      },
    };
  } catch (error) {
    console.error('Failed to select repo:', error);
    const message = error instanceof Error ? error.message : 'Failed to connect repository';
    return { success: false, error: message };
  }
}

export async function disconnectGithub(
  projectId: string
): Promise<ApiResponse<void>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));
    if (!conn) return { success: true };

    if (conn.webhookId && conn.repoOwner && conn.repoName) {
      try {
        const octokit = createOctokit(conn.accessToken);
        await octokit.repos.deleteWebhook({
          owner: conn.repoOwner,
          repo: conn.repoName,
          hook_id: conn.webhookId,
        });
      } catch (err) {
        console.warn('[github] Failed to delete webhook:', err);
      }
    }

    await deleteAllCodeChunks(projectId);
    await db.delete(githubConnections).where(eq(githubConnections.projectId, projectId));

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect GitHub:', error);
    return { success: false, error: 'Failed to disconnect' };
  }
}

export async function triggerReindex(
  projectId: string
): Promise<ApiResponse<{ filesIndexed: number; chunksIndexed: number }>> {
  try {
    await getAuthUser();
    const result = await indexRepo(projectId);
    return {
      success: true,
      data: { filesIndexed: result.filesIndexed, chunksIndexed: result.chunksIndexed },
    };
  } catch (error) {
    console.error('Failed to reindex:', error);
    const message = error instanceof Error ? error.message : 'Reindex failed';
    return { success: false, error: message };
  }
}

export type FileTreeNode = {
  path: string;
  type: 'tree' | 'blob';
  size?: number;
};

export async function getFileTree(
  projectId: string
): Promise<ApiResponse<FileTreeNode[]>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));
    if (!conn || !conn.repoOwner || !conn.repoName) {
      return { success: false, error: 'No repository connected' };
    }

    const octokit = createOctokit(conn.accessToken);
    const branch = conn.defaultBranch || 'main';
    const branchInfo = await octokit.repos.getBranch({
      owner: conn.repoOwner,
      repo: conn.repoName,
      branch,
    });
    const tree = await octokit.git.getTree({
      owner: conn.repoOwner,
      repo: conn.repoName,
      tree_sha: branchInfo.data.commit.commit.tree.sha,
      recursive: 'true',
    });

    const nodes: FileTreeNode[] = tree.data.tree
      .filter((t) => t.path && (t.type === 'tree' || t.type === 'blob'))
      .map((t) => ({
        path: t.path!,
        type: t.type as 'tree' | 'blob',
        size: t.size,
      }));

    return { success: true, data: nodes };
  } catch (error) {
    console.error('Failed to get file tree:', error);
    return { success: false, error: 'Failed to load file tree' };
  }
}

export async function getFileContent(
  projectId: string,
  filepath: string
): Promise<ApiResponse<{ content: string; language: string }>> {
  try {
    await getAuthUser();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId));
    if (!conn || !conn.repoOwner || !conn.repoName) {
      return { success: false, error: 'No repository connected' };
    }

    const octokit = createOctokit(conn.accessToken);
    const res = await octokit.repos.getContent({
      owner: conn.repoOwner,
      repo: conn.repoName,
      path: filepath,
      ref: conn.defaultBranch || undefined,
    });
    if (Array.isArray(res.data) || res.data.type !== 'file') {
      return { success: false, error: 'Not a file' };
    }
    const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
    const { detectLanguage } = await import('./lib/file-filter');
    return { success: true, data: { content, language: detectLanguage(filepath) } };
  } catch (error) {
    console.error('Failed to get file content:', error);
    return { success: false, error: 'Failed to load file' };
  }
}
