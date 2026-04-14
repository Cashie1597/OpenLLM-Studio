import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { splitStreamingMarkdown } from '../lib/markdown';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isLoading?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 mb-6">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      {/* Typing indicator */}
      <div className="bg-[#1C1C1C] border border-[#333333] rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#B1ADA1] text-sm mr-2">Generating</span>
          <div className="w-1.5 h-1.5 bg-[#C15F3C] rounded-full typing-dot"></div>
          <div className="w-1.5 h-1.5 bg-[#C15F3C] rounded-full typing-dot"></div>
          <div className="w-1.5 h-1.5 bg-[#C15F3C] rounded-full typing-dot"></div>
        </div>
      </div>
    </div>
  );
}

function StreamingMessage({ content }: { content: string }) {
  const { stableMarkdown, trailingText } = splitStreamingMarkdown(content);

  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="max-w-[80%] bg-[#1C1C1C] border border-[#333333] rounded-2xl rounded-tl-md px-4 py-3">
        {stableMarkdown && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_:not(pre)>code]:bg-[#0A0A0A] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:text-xs [&_pre]:bg-[#0A0A0A] [&_pre]:border [&_pre]:border-[#333333] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs"
          >
            {stableMarkdown}
          </ReactMarkdown>
        )}
        {trailingText && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/95">
            {trailingText}
          </p>
        )}
      </div>
    </div>
  );
}

export function MessageList({ messages, streamingContent, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isLoading]);

  // Empty state
  if (messages.length === 0 && !streamingContent && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] flex items-center justify-center glow-crail">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Start a conversation</h2>
          <p className="text-[#B1ADA1] text-sm">
            Send a message to begin chatting with your AI assistant
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 bg-[#0A0A0A]">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {/* Show typing indicator when loading and no streaming content yet */}
        {isLoading && !streamingContent && <TypingIndicator />}
        
        {/* Show streaming content */}
        {streamingContent && <StreamingMessage content={streamingContent} />}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
