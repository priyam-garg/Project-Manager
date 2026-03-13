'use server';

import { createClient } from '@/lib/supabase/server';
import type { User } from '@/core/db/schema';

export async function getCurrentUser(): Promise<User | null> {
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
    return null;
  }

  return userData as User;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
