'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSend, 
  isLoading, 
  placeholder = 'Ask a question about your project...' 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSend(trimmedMessage);
      setMessage('');
      
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to send
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
    
    // Prevent default Enter behavior (new line) when Shift is not pressed
    // This allows Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none',
            'focus-visible:ring-1 focus-visible:ring-ring',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          rows={1}
        />
        
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="flex-shrink-0 h-[44px] w-[44px]"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      {/* Keyboard shortcut hint */}
      <div className="text-xs text-muted-foreground text-center mt-2">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> to send, 
        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono ml-1">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
