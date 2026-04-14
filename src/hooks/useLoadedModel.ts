import { useEffect, useState } from 'react';
import { getLoadedModel } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useLoadedModel() {
  const [isLoading, setIsLoading] = useState(true);
  const { loadedModel, setLoadedModel, currentConversationId } = useAppStore();

  const refreshLoadedModel = async () => {
    setIsLoading(true);
    try {
      const model = await getLoadedModel();
      setLoadedModel(model);
    } catch (err) {
      console.error('Failed to get loaded model:', err);
      setLoadedModel(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLoadedModel();
    
    // Poll every 10 seconds
    const interval = setInterval(refreshLoadedModel, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh when conversation switches
  useEffect(() => {
    if (currentConversationId) {
      refreshLoadedModel();
    }
  }, [currentConversationId]);

  return {
    loadedModel,
    isLoading,
  };
}
