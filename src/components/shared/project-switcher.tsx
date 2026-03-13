'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useProjectsStore } from '@/stores/projects-store';
import { useProjects } from '@/modules/projects/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ProjectSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { projects, isLoading } = useProjects();
  const { currentProjectId, setCurrentProject, getCurrentProject } = useProjectsStore();

  const currentProject = getCurrentProject();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = (projectId: string) => {
    setCurrentProject(projectId);
    setIsOpen(false);
    setSearchQuery('');
    router.push(`/projects/${projectId}/board`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={isLoading}
      >
        <span className="truncate">
          {isLoading ? 'Loading...' : currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-md shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-input">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          {/* Project List */}
          <div className="overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects found
              </div>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between',
                    currentProjectId === project.id && 'bg-accent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </div>
                    )}
                  </div>
                  {currentProjectId === project.id && (
                    <Check className="ml-2 h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
