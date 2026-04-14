import { useEffect, useState } from 'react';
import { getConversations, createConversation } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import { generateDefaultTitle } from '../lib/utils';

export function useConversations(dbPath: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { conversations, setConversations } = useAppStore();

  const refreshConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const convs = await getConversations(dbPath);
      setConversations(convs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      console.error('Failed to get conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async (modelName: string, title?: string) => {
    const conversationTitle = title || generateDefaultTitle(modelName);
    try {
      const newConv = await createConversation(dbPath, modelName, conversationTitle);
      await refreshConversations();
      return newConv;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Failed to create conversation:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [dbPath]);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    createConversation: handleCreateConversation,
  };
}
