import { AgentContainer } from '@/modules/agent/components/agent-container';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function AgentPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <AnimatedPage className="h-full">
      <div className="h-full bg-background/10">
        <AgentContainer projectId={projectId} />
      </div>
    </AnimatedPage>
  );
}
