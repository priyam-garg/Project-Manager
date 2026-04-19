'use client';

import { useState } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { SuggestedQuestions } from './suggested-questions';
import { useChat } from '../hooks/use-chat';
import { useMounted } from '@/lib/hooks/use-mounted';

interface ChatContainerProps {
  projectId: string;
}

export function ChatContainer({ projectId }: ChatContainerProps) {
  const { messages, sendMessage, isLoading } = useChat(projectId);
  const mounted = useMounted();
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const showSuggestedQuestions = messages.length === 0 && !isLoading;

  if (!mounted) {
    return (
      <div className="flex h-full flex-col p-4 md:p-6">
        <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 items-center justify-center p-8">
            <SuggestedQuestions onQuestionClick={() => {}} className="w-full" />
          </div>
          <MessageInput onSend={() => {}} isLoading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {showSuggestedQuestions ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <SuggestedQuestions onQuestionClick={handleQuestionClick} className="w-full" />
            </div>
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* Input Area */}
        <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
