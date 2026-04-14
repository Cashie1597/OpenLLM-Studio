import ReactMarkdown from 'react-markdown';
import type { Message } from '../lib/types';
import { cn } from '../lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('mb-6 flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser 
          ? 'bg-[#C15F3C] text-white' 
          : 'bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] text-white'
      )}>
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isUser 
          ? 'bg-[#C15F3C] text-white rounded-tr-md' 
          : 'bg-[#1C1C1C] text-white rounded-tl-md border border-[#333333]'
      )}>
        <div className={cn(
          'text-sm leading-relaxed',
          'prose prose-sm prose-invert max-w-none'
        )}>
          <ReactMarkdown 
            className={cn(
              '[&>*]:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
              '[&_code]:bg-[#0A0A0A] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs',
              '[&_pre]:bg-[#0A0A0A] [&_pre]:border [&_pre]:border-[#333333] [&_pre]:rounded-lg [&_pre]:p-4',
              '[&_pre]:overflow-x-auto [&_pre]:my-3',
              isUser && '[&_code]:bg-[#A84E2F] [&_pre]:bg-[#A84E2F]'
            )}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}