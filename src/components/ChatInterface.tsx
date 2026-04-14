import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { sendChatMessage, stopChatGeneration } from '../lib/tauri';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ErrorBanner } from './ErrorBanner';
import type { Conversation, Message } from '../lib/types';

interface ChatInterfaceProps {
  dbPath: string;
  conversation: Conversation;
  messages: Message[];
  availableModels: string[];
  isLoadingMessages?: boolean;
  onRefreshMessages: () => Promise<void> | void;
  onConversationPatched: (updates: Partial<Conversation>) => void;
}

export function ChatInterface({
  dbPath,
  conversation,
  messages,
  availableModels,
  isLoadingMessages = false,
  onRefreshMessages,
  onConversationPatched,
}: ChatInterfaceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const lastSeqRef = useRef<number>(0);

  const visibleMessages = pendingMessages.length > 0
    ? [...messages, ...pendingMessages]
    : messages;

  useEffect(() => {
    if (pendingMessages.length === 0) return;

    const persistedUserMessages = new Set(
      messages
        .filter((message) => message.role === 'user')
        .map((message) => `${message.role}:${message.content}:${message.conversation_id}`)
    );

    setPendingMessages((current) =>
      current.filter((message) => !persistedUserMessages.has(`${message.role}:${message.content}:${message.conversation_id}`))
    );
  }, [messages, pendingMessages.length]);

  useEffect(() => {
    setPendingMessages([]);
    let unlisten: (() => void) | undefined;
    let mounted = true;

    const setupListener = async () => {
      const unlistenFn = await listen<{ conversation_id?: string; content: string; seq?: number }>('chat-token', (event) => {
        if (!mounted) return;
        if (event.payload.conversation_id && event.payload.conversation_id !== conversation.id) return;

        const { content, seq } = event.payload;
        if (!content || content.trim() === '') return;

        if (seq !== undefined) {
          if (seq <= lastSeqRef.current) return;
          lastSeqRef.current = seq;
        }

        setStreamingContent((prev) => prev + content);
      });

      return unlistenFn;
    };

    setupListener().then((fn) => {
      if (mounted) {
        unlisten = fn;
      } else {
        fn();
      }
    });

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, [conversation.id]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    setIsStopping(false);
    setIsStreaming(true);
    setStreamingContent('');
    lastSeqRef.current = 0;
    setPendingMessages((current) => [
      ...current,
      {
        id: `pending-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    const outgoingMessages = [
      ...visibleMessages.map((message) => ({ role: message.role, content: message.content })),
      { role: 'user', content },
    ];

    try {
      const response = await sendChatMessage(
        dbPath,
        conversation.id,
        conversation.model_name,
        outgoingMessages,
        {
          num_ctx: 2048,
          num_predict: 512,
        }
      );

      if (messages.length === 0) {
        onConversationPatched({
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        });
      }

      if (!streamingContent && response) {
        setStreamingContent(response);
      }

      await onRefreshMessages();
    } catch (err) {
      if (!isStopping) {
        setPendingMessages([]);
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Failed to send chat message:', err);
      }
    } finally {
      setIsStreaming(false);
      setIsStopping(false);
      setStreamingContent('');
    }
  };

  const handleStop = async () => {
    if (!isStreaming) {
      return;
    }

    setIsStopping(true);
    try {
      await stopChatGeneration();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop generation';
      setError(errorMessage);
    }
  };

  const handleModelChange = (model: string) => {
    onConversationPatched({ model_name: model });
  };

  if (availableModels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1C1C1C] border border-[#333333] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#B1ADA1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-white text-sm mb-1">No models installed</p>
          <p className="text-[#B1ADA1] text-xs">Download a model from the Model Library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {error && (
        <div className="p-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <MessageList
        messages={visibleMessages}
        streamingContent={streamingContent}
        isLoading={isLoadingMessages || (isStreaming && !streamingContent)}
      />

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={false}
        placeholder="Message"
        selectedModel={conversation.model_name}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        isGenerating={isStreaming}
      />
    </div>
  );
}
