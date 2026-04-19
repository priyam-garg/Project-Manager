import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChartSpline,
  MessageCircleMore,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AnimatedCard, AnimatedPage } from "@/components/layout/animated-page";
import { Button } from "@/components/ui/button";

const highlightCards = [
  {
    title: "Structured Workflows",
    description: "Roadmaps, kanban, and AI planning all connected in one flow.",
    icon: Workflow,
  },
  {
    title: "Contextual AI Chat",
    description: "Ask questions about project health and get grounded answers instantly.",
    icon: MessageCircleMore,
  },
  {
    title: "Live Team Insights",
    description: "Track delivery trends, priorities, and momentum without busywork.",
    icon: ChartSpline,
  },
];

export default function LandingPage() {
  return (
    <AnimatedPage className="min-h-screen">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/30 bg-card/70 px-6 backdrop-blur-xl lg:px-14 dark:border-white/10">
          <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between">
            <Link className="flex items-center gap-2" href="/">
              <span className="rounded-xl bg-primary/15 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-2xl font-bold tracking-tight">Nexus</span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-5">
              <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="/sign-in">
                Log in
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="gap-1.5">
                  Sign up
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-10 lg:px-14 lg:pt-14">
          <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-background/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI-native Project OS
              </p>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Plan faster.
                <br />
                Build calmer.
                <br />
                <span className="text-gradient">Ship with confidence.</span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Nexus combines roadmap intelligence, collaborative boards, and contextual AI into a single fluid workspace for modern teams.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    See Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            <AnimatedCard delay={0.2} className="glass-card overflow-hidden p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Execution Snapshot</h2>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    On Track
                  </span>
                </div>
                <div className="space-y-3">
                  {["Roadmap Coverage", "Sprint Velocity", "AI Assist Accuracy"].map((label, index) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{label}</span>
                        <span className="font-semibold text-foreground">{[92, 78, 89][index]}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary/85"
                          style={{ width: `${[92, 78, 89][index]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </section>

          <section className="mt-14 grid gap-4 md:grid-cols-3">
            {highlightCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <AnimatedCard key={item.title} delay={0.28 + index * 0.08} className="glass-card p-5 sm:p-6">
                  <div className="mb-3 inline-flex rounded-xl bg-primary/12 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Included by default
                  </div>
                </AnimatedCard>
              );
            })}
          </section>
        </main>
      </div>
    </AnimatedPage>
  );
}
