import { ChatContainer } from '@/modules/chat/components/chat-container';

interface ChatPageProps {
  params: {
    projectId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <div className="h-full flex flex-col">
      <ChatContainer projectId={params.projectId} />
    </div>
  );
}
