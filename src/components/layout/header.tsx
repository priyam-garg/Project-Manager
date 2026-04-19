'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu } from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';
import { Button } from '@/components/ui/button';
import { useProjectsStore } from '@/stores/projects-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { getCurrentProject } = useProjectsStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const currentProject = getCurrentProject();

  // Parse pathname to generate breadcrumbs
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    // Build breadcrumbs from path segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dynamic route segments (like [projectId])
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return;
      }

      // Handle project ID segment
      if (segments[index - 1] === 'projects' && currentProject) {
        breadcrumbs.push({
          label: currentProject.name,
          href: currentPath,
        });
        return;
      }

      // Format segment label
      let label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Map specific routes to better labels
      const labelMap: Record<string, string> = {
        projects: 'Projects',
        board: 'Board',
        chat: 'Chat',
        agent: 'Agent',
        insight: 'Insights',
      };

      label = labelMap[segment] || label;

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/25 bg-card/70 px-4 backdrop-blur-xl md:px-6 dark:border-white/10">
      <div className="flex items-center gap-4">
        {/* Hamburger menu button - shows when sidebar is closed */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.length === 0 ? (
              <li>
                <span className="text-sm font-medium text-foreground">Home</span>
              </li>
            ) : (
              breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <li key={crumb.href} className="flex items-center space-x-2">
                    {index > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                    )}
                    {isLast ? (
                      <span className="rounded-full bg-accent/70 px-2.5 py-1 text-xs font-semibold text-foreground md:text-sm md:bg-transparent md:px-0 md:py-0">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className={cn(
                          'text-xs font-medium text-muted-foreground md:text-sm',
                          'hover:text-foreground transition-colors'
                        )}
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })
            )}
          </ol>
        </nav>
      </div>

      {/* Right side: Project name and theme toggle */}
      <div className="flex items-center gap-4">
        {currentProject && (
          <div className="hidden rounded-xl border border-white/30 bg-background/65 px-3 py-1.5 md:flex md:flex-col md:items-end dark:border-white/10">
            <span className="text-xs text-muted-foreground">Current Project</span>
            <span className="max-w-[220px] truncate text-sm font-medium">{currentProject.name}</span>
          </div>
        )}
        <UserNav />
      </div>
    </header>
  );
}
