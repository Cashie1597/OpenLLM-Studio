import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, listenToChatToken } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import type { ChatMessage, ChatOptions } from '../lib/types';

export function useChat(dbPath: string, conversationId: string | null, modelName: string) {
  const [error, setError] = useState<string | null>(null);
  const lastTokenRef = useRef<string>('');
  const lastSeqRef = useRef<number>(0);
  
  const {
    messages,
    isStreaming,
    streamingContent,
    optimizationSettings,
    setIsStreaming,
    appendStreamingContent,
    clearStreamingContent,
    addMessage,
  } = useAppStore();

  useEffect(() => {
    // Reset last token when conversation changes
    lastTokenRef.current = '';
    lastSeqRef.current = 0;
    
    let unlisten: (() => void) | undefined;
    let mounted = true;
    
    const setupListener = async () => {
      const unlistenFn = await listenToChatToken((token) => {
        if (!mounted) return;
        if (token.conversation_id === conversationId) {
          // Skip empty tokens
          if (!token.content || token.content.trim() === '') {
            return;
          }
          
          // Use sequence number for deduplication (if available)
          // This ensures each token is only processed once
          const seq = (token as any).seq as number | undefined;
          if (seq !== undefined) {
            if (seq <= lastSeqRef.current) {
              // Skip duplicate or out-of-order token
              return;
            }
            lastSeqRef.current = seq;
          } else {
            // Fallback to content-based deduplication
            if (token.content === lastTokenRef.current) {
              return;
            }
            lastTokenRef.current = token.content;
          }
          
          appendStreamingContent(token.content);
        }
      });
      return unlistenFn;
    };

    setupListener().then((fn) => {
      if (mounted) {
        unlisten = fn;
      } else {
        // Component unmounted before listener was set up, clean it up
        fn();
      }
    });

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, [conversationId]); // Removed appendStreamingContent from deps - it's stable from zustand

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) {
      return;
    }

    setError(null);
    setIsStreaming(true);
    clearStreamingContent();

    // Build messages array from conversation history
    const chatMessages: ChatMessage[] = [
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content,
      },
    ];

    // Build ChatOptions from optimization settings
    const options: ChatOptions | undefined = optimizationSettings ? {
      num_ctx: optimizationSettings.num_ctx,
      num_gpu: optimizationSettings.num_gpu,
      num_batch: optimizationSettings.num_batch,
      num_thread: optimizationSettings.num_thread,
    } : undefined;

    try {
      const response = await sendChatMessage(dbPath, conversationId, modelName, chatMessages, options);
      
      // Add user message to local state
      addMessage({
        id: '', // Will be set by backend
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      });

      // Add assistant message to local state
      addMessage({
        id: '', // Will be set by backend
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send chat message:', err);
    } finally {
      setIsStreaming(false);
      clearStreamingContent();
    }
  };

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
  };
}
