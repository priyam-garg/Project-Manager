import { ChatContainer } from '@/modules/chat/components/chat-container';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ChatPage({ params }: Props) {
  const { projectId } = await params;
  
  return (
    <div className="h-full bg-background">
      <ChatContainer projectId={projectId} />
    </div>
  );
}
