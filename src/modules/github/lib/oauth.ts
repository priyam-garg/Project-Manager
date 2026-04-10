const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export function getOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
  const redirectUri =
    process.env.GITHUB_OAUTH_REDIRECT_URL ||
    `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/github/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo read:user',
    state,
    allow_signup: 'true',
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub token exchange failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!payload.access_token) {
    throw new Error(
      `GitHub token exchange returned no token: ${payload.error_description || payload.error || 'unknown error'}`
    );
  }

  return payload.access_token;
}
