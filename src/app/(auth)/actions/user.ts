'use server';

import { createClient } from '@/lib/supabase/server';
import type { User } from '@/core/db/schema';

export async function getCurrentUser(): Promise<Partial<User> | null> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbError || !userData) {
    // Fallback to auth data if DB record is missing
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    };
  }

  return userData as User;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
