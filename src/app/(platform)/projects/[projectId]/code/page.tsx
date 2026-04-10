import { CodeBrowser } from '@/modules/github/components/code-browser';

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function CodePage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="h-full bg-background">
      <CodeBrowser projectId={projectId} />
    </div>
  );
}
