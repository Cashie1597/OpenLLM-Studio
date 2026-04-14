import { useEffect, useState } from 'react';
import { getMessages } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useMessages(dbPath: string, conversationId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const { messages, setMessages } = useAppStore();

  const refreshMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const msgs = await getMessages(dbPath, conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    refreshMessages();
  }, [dbPath, conversationId]);

  return {
    messages,
    isLoading,
    refreshMessages,
  };
}
