import { signup, signInWithGoogle } from '../sign-in/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignUpPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error as string | undefined;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Create an account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Enter your details to get started
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        
        <form className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-800 dark:placeholder:text-slate-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-800 dark:placeholder:text-slate-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-800 dark:placeholder:text-slate-500 transition-all"
              />
            </div>
          </div>
          
          <Button 
            className="w-full rounded-xl h-12 text-md font-medium shadow-md hover:shadow-lg transition-all"
            formAction={signup}
          >
            Sign up
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        <form>
          <Button
            type="submit"
            variant="outline"
            className="w-full rounded-xl h-12 text-md font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            formAction={signInWithGoogle}
          >
            <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
