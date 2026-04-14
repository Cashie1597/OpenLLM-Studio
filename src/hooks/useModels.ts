import { useEffect, useState } from 'react';
import { listModels } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useModels() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { installedModels, setInstalledModels } = useAppStore();

  const refreshModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const models = await listModels();
      setInstalledModels(models);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
      setError(errorMessage);
      console.error('Failed to list models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshModels();
  }, []);

  return {
    installedModels,
    isLoading,
    error,
    refreshModels,
  };
}
