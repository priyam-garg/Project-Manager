'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useProjectsStore } from '@/stores/projects-store';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  BarChart3,
  X,
  ChevronDown,
  Map,
  Home,
  Code,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { currentProjectId, getCurrentProject, projects, setProjects, setCurrentProject } = useProjectsStore();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentProject = getCurrentProject();

  // Fetch projects on mount
  useEffect(() => {
    async function loadProjects() {
      const { getProjects } = await import('@/modules/projects/actions');
      const result = await getProjects();
      if (result.success && result.data) {
        setProjects(result.data);
      }
    }
    
    if (projects.length === 0) {
      loadProjects();
    }
  }, [projects.length, setProjects]);

  // Validate currentProjectId against loaded projects
  // Clears stale IDs from localStorage (e.g. old mock data like "project-3")
  useEffect(() => {
    if (projects.length === 0) return;

    if (currentProjectId) {
      const exists = projects.some((p) => p.id === currentProjectId);
      if (!exists) {
        // Stale project ID — clear it
        setCurrentProject(projects[0].id);
      }
    }
  }, [projects, currentProjectId, setCurrentProject]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile, setSidebarOpen]);

  const navItems: NavItem[] = currentProjectId
    ? [
        {
          name: 'Board',
          href: `/projects/${currentProjectId}/board`,
          icon: LayoutDashboard,
        },
        {
          name: 'Roadmap',
          href: `/projects/${currentProjectId}/roadmap`,
          icon: Map,
        },
        {
          name: 'Chat',
          href: `/projects/${currentProjectId}/chat`,
          icon: MessageSquare,
        },
        {
          name: 'Agent',
          href: `/projects/${currentProjectId}/agent`,
          icon: Bot,
        },
        {
          name: 'Insights',
          href: `/projects/${currentProjectId}/insight`,
          icon: BarChart3,
        },
        {
          name: 'Code',
          href: `/projects/${currentProjectId}/code`,
          icon: Code,
        },
        {
          name: 'Settings',
          href: `/projects/${currentProjectId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-72 border-r border-white/25 bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-out dark:border-white/10',
          'flex flex-col',
          !sidebarOpen && '-translate-x-full'
        )}
      >
        {/* Header with logo and toggle */}
        <div className="flex h-16 items-center justify-between border-b border-white/25 px-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Nexus</h1>
              <p className="text-[11px] text-muted-foreground">Project Intelligence</p>
            </div>
          </div>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Project Switcher */}
        <div className="border-b border-white/25 p-4 dark:border-white/10">
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-white/30 bg-background/60 px-3 py-2.5 text-sm transition-all hover:border-primary/35 hover:bg-accent/70 dark:border-white/10"
            >
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[11px] text-muted-foreground">Current Project</span>
                <span className="truncate font-medium">
                  {currentProject?.name || 'Select Project'}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  projectMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Project dropdown */}
            {projectMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-xl border border-white/30 bg-popover/95 p-1 shadow-xl backdrop-blur dark:border-white/10">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}/board`}
                      onClick={() => {
                        setCurrentProject(project.id);
                        setProjectMenuOpen(false);
                      }}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                        project.id === currentProjectId && 'bg-accent/90'
                      )}
                    >
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {project.description}
                        </div>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No projects available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/90 text-primary-foreground shadow-[0_14px_30px_-20px_hsl(var(--primary))]'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Dashboard */}
        {currentProjectId && (
          <div className="border-t border-white/25 p-4 dark:border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent/80 hover:text-accent-foreground"
            >
              <Home className="h-[18px] w-[18px]" />
              Dashboard
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
