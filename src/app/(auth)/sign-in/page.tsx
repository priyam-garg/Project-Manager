import { login, signInWithGoogle } from '@/app/(auth)/sign-in/actions'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error as string | undefined;
  const nextRaw = resolvedParams.next;
  const next = typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//')
    ? nextRaw
    : '';
  const signUpHref = next ? `/sign-up?next=${encodeURIComponent(next)}` : '/sign-up';

  return (
    <AnimatedPage className="min-h-screen">
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
        <div className="glass-card w-full max-w-md space-y-7 p-8 sm:p-10">
          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/14 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          <form className="space-y-6">
            {next && <input type="hidden" name="next" value={next} />}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-11"
                />
              </div>
            </div>

            <Button className="h-11 w-full" formAction={login}>
              Log in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form>
            {next && <input type="hidden" name="next" value={next} />}
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full gap-3"
              formAction={signInWithGoogle}
            >
              <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href={signUpHref} className="font-semibold text-primary transition-colors hover:text-primary/80">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
