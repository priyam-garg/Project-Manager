import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/core/db/client';
import { githubConnections } from '@/core/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/modules/github/lib/webhook-verify';
import { reindexChangedFiles } from '@/modules/github/lib/indexer';
import { matchCommitToTasks } from '@/modules/github/lib/commit-matcher';
import { updateTask } from '@/core/db/queries/tasks';

type PushCommit = {
  id: string;
  message: string;
  added?: string[];
  modified?: string[];
  removed?: string[];
};

type PushPayload = {
  repository?: { full_name?: string };
  commits?: PushCommit[];
  head_commit?: PushCommit;
};

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event === 'ping') {
    return NextResponse.json({ ok: true, pong: true });
  }
  if (event !== 'push') {
    return NextResponse.json({ ok: true, ignored: event });
  }

  let payload: PushPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) {
    return NextResponse.json({ ok: true, ignored: 'no repository' });
  }

  const [conn] = await db
    .select()
    .from(githubConnections)
    .where(eq(githubConnections.repoFullName, repoFullName));

  if (!conn) {
    return NextResponse.json({ ok: true, ignored: 'unknown repo' });
  }

  const projectId = conn.projectId;
  const ownerUserId = conn.userId;
  const commits = payload.commits || [];

  // Defer heavy work so the webhook responds quickly
  after(async () => {
    for (const commit of commits) {
      const changed = [...(commit.added || []), ...(commit.modified || [])];
      const removed = commit.removed || [];

      try {
        await reindexChangedFiles(projectId, changed, removed);
      } catch (err) {
        console.warn(`[github-webhook] reindex failed for ${commit.id}:`, err);
      }

      try {
        const matched = await matchCommitToTasks({
          projectId,
          commitMessage: commit.message,
          filesChanged: changed,
        });
        for (const taskId of matched) {
          try {
            await updateTask(taskId, { status: 'done' }, ownerUserId);
            console.info(
              `[github-webhook] auto-closed task ${taskId} from commit ${commit.id}`
            );
          } catch (err) {
            console.warn(`[github-webhook] failed to close task ${taskId}:`, err);
          }
        }
      } catch (err) {
        console.warn(`[github-webhook] commit matcher failed for ${commit.id}:`, err);
      }
    }
  });

  return NextResponse.json({ ok: true, commits: commits.length });
}
