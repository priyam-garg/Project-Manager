import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Nexus
          </span>
        </Link>
        <nav className="flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            href="/sign-in"
          >
            Log in
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" size="sm">
              Sign up <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-20 pb-32">
        <div className="max-w-[800px] space-y-8 relative">
            {/* Background glowing blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[80px] -z-10" />
            
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Manage projects with{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">
                unmatched clarity
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
              Nexus is the ultimate platform for teams to collaborate, plan, and execute fast. Built for speed and wrapped in beautiful design.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)] transition-all hover:-translate-y-1 group">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-[800px] mx-auto animate-in fade-in duration-1000 delay-500">
                <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CheckCircle2 className="h-8 w-8 text-blue-500 mb-2" />
                    <h3 className="font-semibold text-lg">Intuitive Boards</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop your way to perfect organization.</p>
                </div>
                <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CheckCircle2 className="h-8 w-8 text-indigo-500 mb-2" />
                    <h3 className="font-semibold text-lg">Real-time Sync</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Collaborate with your team without missing a beat.</p>
                </div>
                <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CheckCircle2 className="h-8 w-8 text-purple-500 mb-2" />
                    <h3 className="font-semibold text-lg">Beautiful Design</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">A dark mode experience you'll love working in.</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
