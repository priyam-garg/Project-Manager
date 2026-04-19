import { ChatContainer } from '@/modules/chat/components/chat-container';
import { AnimatedPage } from '@/components/layout/animated-page';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ChatPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <AnimatedPage className="h-full">
      <div className="h-full bg-background/10">
        <ChatContainer projectId={projectId} />
      </div>
    </AnimatedPage>
  );
}
