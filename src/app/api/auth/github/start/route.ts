import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAuthUser } from '@/core/auth';
import { buildAuthorizeUrl } from '@/modules/github/lib/oauth';

export async function GET(request: Request) {
  try {
    await getAuthUser();
  } catch {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const state = randomBytes(16).toString('hex');
  const authorizeUrl = buildAuthorizeUrl(state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set('gh_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });
  response.cookies.set('gh_oauth_project', projectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
