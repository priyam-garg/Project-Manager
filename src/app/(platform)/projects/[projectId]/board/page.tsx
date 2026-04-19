import { Board } from '@/modules/kanban/components/board';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <AnimatedPage className="h-full">
      <div className="flex h-full flex-col overflow-hidden bg-background/10">
        <div className="flex-1 overflow-auto soft-scrollbar">
          <Board projectId={projectId} />
        </div>
      </div>
    </AnimatedPage>
  );
}
