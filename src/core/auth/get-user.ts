import { createClient } from '@/lib/supabase/server';

/**
 * Get the authenticated user from the current Supabase session.
 * Throws an error if not authenticated — use in server actions.
 */
export async function getAuthUser(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in to continue.');
  }

  return {
    id: user.id,
    email: user.email!,
  };
}

/**
 * Optional version that returns null instead of throwing.
 * Use when auth is optional (e.g., public pages).
 */
export async function getOptionalAuthUser(): Promise<{ id: string; email: string } | null> {
  try {
    return await getAuthUser();
  } catch {
    return null;
  }
}
