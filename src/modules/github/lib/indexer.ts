import { db } from '@/core/db/client';
import { githubConnections, githubIndexedFiles } from '@/core/db/schema';
import { and, eq } from 'drizzle-orm';
import { createOctokit } from './octokit';
import { shouldIndexFile, detectLanguage } from './file-filter';
import { chunkFileContent } from './chunker';
import {
  upsertCodeChunk,
  deleteCodeChunksByFile,
  deleteAllCodeChunks,
} from '@/modules/rag/code-sync';

function generateId(): string {
  return crypto.randomUUID();
}

async function getConnection(projectId: string) {
  const [conn] = await db
    .select()
    .from(githubConnections)
    .where(eq(githubConnections.projectId, projectId));
  if (!conn) throw new Error('GitHub connection not found for this project');
  if (!conn.repoOwner || !conn.repoName) {
    throw new Error('Repository not selected for this connection');
  }
  return conn;
}

/**
 * Full repo index. Walks the default branch tree, filters, chunks, embeds.
 */
export async function indexRepo(projectId: string): Promise<{
  filesIndexed: number;
  chunksIndexed: number;
  filesSkipped: number;
}> {
  const conn = await getConnection(projectId);
  const octokit = createOctokit(conn.accessToken);
  const owner = conn.repoOwner!;
  const repo = conn.repoName!;

  // Resolve default branch tip SHA
  const branch = conn.defaultBranch || 'main';
  const branchInfo = await octokit.repos.getBranch({ owner, repo, branch });
  const commitSha = branchInfo.data.commit.sha;
  const treeSha = branchInfo.data.commit.commit.tree.sha;

  // Get full recursive tree
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: 'true',
  });

  // Wipe previous index for this project before re-indexing
  await deleteAllCodeChunks(projectId);
  await db.delete(githubIndexedFiles).where(eq(githubIndexedFiles.projectId, projectId));

  let filesIndexed = 0;
  let chunksIndexed = 0;
  let filesSkipped = 0;

  for (const item of tree.data.tree) {
    if (item.type !== 'blob' || !item.path || !item.sha) continue;
    const decision = shouldIndexFile(item.path, item.size ?? 0);
    if (!decision.include) {
      filesSkipped++;
      continue;
    }

    try {
      const blob = await octokit.git.getBlob({ owner, repo, file_sha: item.sha });
      const content = Buffer.from(blob.data.content, 'base64').toString('utf-8');
      // Skip binary-looking content
      if (content.includes('\u0000')) {
        filesSkipped++;
        continue;
      }

      const language = detectLanguage(item.path);
      const chunks = chunkFileContent(item.path, content);

      for (const chunk of chunks) {
        await upsertCodeChunk({
          projectId,
          filepath: item.path,
          sha: item.sha,
          chunkIndex: chunk.index,
          text: chunk.text,
          language,
        });
        chunksIndexed++;
      }

      await db.insert(githubIndexedFiles).values({
        id: generateId(),
        projectId,
        filepath: item.path,
        sha: item.sha,
        chunkCount: chunks.length,
      });
      filesIndexed++;
    } catch (err) {
      console.warn(`[github-indexer] Failed to index ${item.path}:`, err);
      filesSkipped++;
    }
  }

  await db
    .update(githubConnections)
    .set({
      lastIndexedSha: commitSha,
      lastIndexedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(githubConnections.projectId, projectId));

  return { filesIndexed, chunksIndexed, filesSkipped };
}

/**
 * Re-index a specific set of changed paths and remove deleted ones.
 * Called from the webhook on push events.
 */
export async function reindexChangedFiles(
  projectId: string,
  changed: string[],
  removed: string[]
): Promise<void> {
  const conn = await getConnection(projectId);
  const octokit = createOctokit(conn.accessToken);
  const owner = conn.repoOwner!;
  const repo = conn.repoName!;
  const branch = conn.defaultBranch || 'main';

  // Remove deleted files
  for (const path of removed) {
    await deleteCodeChunksByFile(projectId, path);
    await db
      .delete(githubIndexedFiles)
      .where(
        and(
          eq(githubIndexedFiles.projectId, projectId),
          eq(githubIndexedFiles.filepath, path)
        )
      );
  }

  // Re-index changed files
  for (const path of changed) {
    try {
      const fileRes = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      if (Array.isArray(fileRes.data) || fileRes.data.type !== 'file') continue;

      const size = fileRes.data.size ?? 0;
      const decision = shouldIndexFile(path, size);
      if (!decision.include) continue;

      const content = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');
      if (content.includes('\u0000')) continue;

      // Drop old chunks for this file before re-upserting
      await deleteCodeChunksByFile(projectId, path);
      await db
        .delete(githubIndexedFiles)
        .where(
          and(
            eq(githubIndexedFiles.projectId, projectId),
            eq(githubIndexedFiles.filepath, path)
          )
        );

      const language = detectLanguage(path);
      const chunks = chunkFileContent(path, content);
      const sha = fileRes.data.sha;

      for (const chunk of chunks) {
        await upsertCodeChunk({
          projectId,
          filepath: path,
          sha,
          chunkIndex: chunk.index,
          text: chunk.text,
          language,
        });
      }

      await db.insert(githubIndexedFiles).values({
        id: generateId(),
        projectId,
        filepath: path,
        sha,
        chunkCount: chunks.length,
      });
    } catch (err) {
      console.warn(`[github-indexer] Failed to reindex ${path}:`, err);
    }
  }

  await db
    .update(githubConnections)
    .set({ lastIndexedAt: new Date(), updatedAt: new Date() })
    .where(eq(githubConnections.projectId, projectId));
}
