import { AgentContainer } from '@/modules/agent/components/agent-container';

interface AgentPageProps {
  params: {
    projectId: string;
  };
}

export default function AgentPage({ params }: AgentPageProps) {
  return (
    <div className="h-full">
      <AgentContainer projectId={params.projectId} />
    </div>
  );
}
