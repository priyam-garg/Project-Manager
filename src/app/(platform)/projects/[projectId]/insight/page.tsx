import { DashboardContainer } from '@/modules/insight/components/dashboard-container';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function InsightPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <div className="h-full bg-background">
      <DashboardContainer projectId={projectId} />
    </div>
  );
}
