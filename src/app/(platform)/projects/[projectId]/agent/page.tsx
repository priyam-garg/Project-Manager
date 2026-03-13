import { AgentContainer } from '@/modules/agent/components/agent-container';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function AgentPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <div className="h-full bg-background">
      <AgentContainer projectId={projectId} />
    </div>
  );
}
