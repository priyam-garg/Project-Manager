import { DashboardContainer } from '@/modules/insight/components/dashboard-container';

interface InsightPageProps {
  params: {
    projectId: string;
  };
}

export default function InsightPage({ params }: InsightPageProps) {
  return (
    <div className="h-full">
      <DashboardContainer projectId={params.projectId} />
    </div>
  );
}
