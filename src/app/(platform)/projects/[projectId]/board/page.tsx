import { Suspense } from 'react';
import { Board } from '@/modules/kanban/components/board';
import { TaskModal } from '@/modules/kanban/components/task-modal';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

interface BoardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

// Loading skeleton for the board
function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-80 min-w-80 space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectId } = await params;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full">
        <Suspense fallback={<BoardSkeleton />}>
          <Board projectId={projectId} />
        </Suspense>
        
        {/* Task Modal - rendered at page level for proper z-index */}
        <TaskModal />
      </div>
    </ErrorBoundary>
  );
}
