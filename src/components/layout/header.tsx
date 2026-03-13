'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isLast ? (
                      <span className="text-sm font-medium text-foreground">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className={cn(
                          'text-sm font-medium text-muted-foreground',
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
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Current Project</span>
            <span className="text-sm font-medium">{currentProject.name}</span>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
