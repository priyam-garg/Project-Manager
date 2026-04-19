import { DashboardContainer } from '@/modules/insight/components/dashboard-container';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function InsightPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <AnimatedPage className="h-full">
      <div className="h-full bg-background/10">
        <DashboardContainer projectId={projectId} />
      </div>
    </AnimatedPage>
  );
}
