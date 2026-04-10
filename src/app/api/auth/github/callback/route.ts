import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/core/db/client';
import { githubConnections } from '@/core/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/core/auth';
import { exchangeCodeForToken } from '@/modules/github/lib/oauth';
import { createOctokit } from '@/modules/github/lib/octokit';

function generateId(): string {
  return crypto.randomUUID();
}

export async function GET(request: Request) {
  let user;
  try {
    user = await getAuthUser();
  } catch {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('gh_oauth_state')?.value;
  const projectId = cookieStore.get('gh_oauth_project')?.value;

  if (!expectedState || expectedState !== state) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project context' }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(code);
  } catch (err) {
    console.error('GitHub token exchange failed:', err);
    return NextResponse.redirect(
      new URL(`/projects/${projectId}/settings?github=error`, origin)
    );
  }

  const octokit = createOctokit(accessToken);
  const userRes = await octokit.users.getAuthenticated();
  const githubLogin = userRes.data.login;

  // Upsert connection
  const [existing] = await db
    .select()
    .from(githubConnections)
    .where(eq(githubConnections.projectId, projectId));

  if (existing) {
    await db
      .update(githubConnections)
      .set({
        userId: user.id,
        accessToken,
        githubUserLogin: githubLogin,
        updatedAt: new Date(),
      })
      .where(eq(githubConnections.projectId, projectId));
  } else {
    await db.insert(githubConnections).values({
      id: generateId(),
      projectId,
      userId: user.id,
      githubUserLogin: githubLogin,
      accessToken,
    });
  }

  const response = NextResponse.redirect(
    new URL(`/projects/${projectId}/settings?github=connected`, origin)
  );
  response.cookies.delete('gh_oauth_state');
  response.cookies.delete('gh_oauth_project');
  return response;
}
