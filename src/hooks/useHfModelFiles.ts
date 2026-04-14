import { useState } from 'react';
import { getHfModelDetails, getHfModelFiles } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import type { HfModelDetails, HfModelFile } from '../lib/types';

export function useHfModelFiles() {
  const { hfToken } = useAppStore();
  const [modelFiles, setModelFiles] = useState<HfModelFile[]>([]);
  const [modelDetails, setModelDetails] = useState<HfModelDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async (repoId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [files, details] = await Promise.all([
        getHfModelFiles(repoId, hfToken || undefined),
        getHfModelDetails(repoId, hfToken || undefined),
      ]);
      setModelFiles(files);
      setModelDetails(details);
    } catch (err) {
      let errorMessage = 'Failed to load model files';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check if it's a rate limit error
        if (errorMessage.includes('Rate limit exceeded')) {
          const match = errorMessage.match(/retry after (\d+) seconds/);
          if (match) {
            const seconds = parseInt(match[1]);
            errorMessage = `Rate limit exceeded. Please wait ${seconds} seconds before trying again.`;
          }
        }
      }
      
      setError(errorMessage);
      console.error('Load files error:', err);
      setModelFiles([]);
      setModelDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    modelFiles,
    modelDetails,
    isLoading,
    error,
    loadFiles,
  };
}
