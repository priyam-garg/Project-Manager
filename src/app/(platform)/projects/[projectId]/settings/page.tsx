import { GithubSettingsSection } from '@/modules/github/components/github-settings-section';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSettingsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AnimatedPage className="h-full">
      <div className="h-full overflow-y-auto bg-background/10 soft-scrollbar">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gradient">Project Settings</h1>
            <p className="text-muted-foreground">Manage integrations and project configuration</p>
          </div>
          <GithubSettingsSection projectId={projectId} />
        </div>
      </div>
    </AnimatedPage>
  );
}
