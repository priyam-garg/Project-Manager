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
  User,
  LogOut,
  Settings,
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
  const { currentProjectId, getCurrentProject, projects, setProjects } = useProjectsStore();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
      ]
    : [];

  const isActive = (href: string) => pathname === href;

  // Mock current user
  const currentUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatarUrl: '/avatars/alice.jpg',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out',
          'flex flex-col',
          !sidebarOpen && '-translate-x-full'
        )}
      >
        {/* Header with logo and toggle */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold">Nexus</h1>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Project Switcher */}
        <div className="border-b p-4">
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
            >
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-xs text-muted-foreground">Project</span>
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
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}/board`}
                      onClick={() => setProjectMenuOpen(false)}
                      className={cn(
                        'block px-3 py-2 text-sm hover:bg-accent',
                        project.id === currentProjectId && 'bg-accent'
                      )}
                    >
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground">
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
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Menu */}
        <div className="border-t p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="truncate font-medium">{currentUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover shadow-lg">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
