import { GithubSettingsSection } from '@/modules/github/components/github-settings-section';

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSettingsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground">Manage integrations and project configuration</p>
        </div>
        <GithubSettingsSection projectId={projectId} />
      </div>
    </div>
  );
}
