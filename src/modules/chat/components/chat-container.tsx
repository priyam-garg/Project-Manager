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
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <SuggestedQuestions onQuestionClick={() => {}} />
          </div>
        </div>

        <MessageInput onSend={() => {}} isLoading={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {showSuggestedQuestions ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <SuggestedQuestions onQuestionClick={handleQuestionClick} />
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input Area */}
      <MessageInput 
        onSend={handleSendMessage} 
        isLoading={isLoading}
      />
    </div>
  );
}
