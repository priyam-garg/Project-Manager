'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Supabase Login Error:", error)
    redirect(`/sign-in?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.name,
      }
    }
  })

  if (error) {
    console.error("Supabase Signup Error:", error)
    redirect(`/sign-up?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`)
  }
  
  // Insert the user into the public schema's `users` table since there
  // are no triggers enabled setup by default
  const user = authData?.user;
  if (user) {
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: data.email,
      name: data.name,
    });
    
    if (insertError) {
      console.error("Failed to sync user to public table:", insertError);
      // Optional: still complete sign up but log the sync error. Note redirect 
      // is below. We rely on standard Supabase signups for general sessions.
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
