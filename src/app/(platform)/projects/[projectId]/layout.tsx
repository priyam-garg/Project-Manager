'use client';

import { use, useEffect } from 'react';
import { useProjectsStore } from '@/stores/projects-store';

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { setCurrentProject } = useProjectsStore();
  const { projectId } = use(params);

  // Set current project ID when layout mounts
  useEffect(() => {
    setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  return <>{children}</>;
}
