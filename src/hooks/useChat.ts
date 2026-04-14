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
          // Preserve whitespace-only tokens because they carry markdown structure
          if (token.content === undefined || token.content === null || token.content === '') {
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

    // Add user message immediately so it shows in UI right away
    addMessage({
      id: '',
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    });

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

      // Log raw response — open webview devtools (right-click → Inspect) to see this
      console.log('%c[RAW RESPONSE]', 'color: orange; font-weight: bold', response);

      // Add assistant message to local state
      addMessage({
        id: '',
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      // If generation was stopped mid-stream, add whatever was streamed so far
      const partial = useAppStore.getState().streamingContent;
      if (partial.trim()) {
        console.log('[RAW RESPONSE (partial)]', partial);
        addMessage({
          id: '',
          conversation_id: conversationId,
          role: 'assistant',
          content: partial,
          created_at: new Date().toISOString(),
        });
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      // Only set error if it's not a user-initiated stop
      if (!errorMessage.toLowerCase().includes('stop') && !errorMessage.toLowerCase().includes('cancel') && !errorMessage.toLowerCase().includes('abort')) {
        setError(errorMessage);
        console.error('Failed to send chat message:', err);
      }
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
