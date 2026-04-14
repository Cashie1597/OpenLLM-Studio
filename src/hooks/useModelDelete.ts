import { useState } from 'react';
import { deleteModel } from '../lib/tauri';

export function useModelDelete(onSuccess?: () => void) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteModel = async (modelName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${modelName}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteModel(modelName);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete model';
      setError(errorMessage);
      console.error('Failed to delete model:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteModel: handleDeleteModel,
    isDeleting,
    error,
  };
}
