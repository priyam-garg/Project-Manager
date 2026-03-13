import { Board } from '@/modules/kanban/components/board';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <Board projectId={projectId} />
      </div>
    </div>
  );
}
