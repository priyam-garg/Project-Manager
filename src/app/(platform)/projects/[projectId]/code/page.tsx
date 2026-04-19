import { CodeBrowser } from '@/modules/github/components/code-browser';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function CodePage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AnimatedPage className="h-full">
      <div className="h-full bg-background/10">
        <CodeBrowser projectId={projectId} />
      </div>
    </AnimatedPage>
  );
}
