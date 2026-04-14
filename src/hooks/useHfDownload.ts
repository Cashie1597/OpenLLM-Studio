import { useEffect, useCallback } from 'react';
import { downloadHfModel, cancelHfDownload, pauseHfDownload, listenToHfDownloadProgress, listenToHfDownloadStatus } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import { listModels } from '../lib/tauri';

export function useHfDownload() {
  const { hfToken, hfDownloads, updateHfDownload, removeHfDownload, setInstalledModels, addToast } = useAppStore();

  const downloadModel = async (repoId: string, filename: string, modelName: string) => {
    try {
      updateHfDownload(modelName, {
        model_name: modelName,
        repo_id: repoId,
        filename,
        bytes_downloaded: 0,
        total_bytes: 0,
        speed_mbps: 0,
        percentage: 0,
        eta_seconds: null,
        status: 'starting',
      });
      await downloadHfModel(repoId, filename, modelName, hfToken || undefined);
    } catch (err) {
      console.error('Download error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Download failed';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Enhance error messages
        if (errorMessage.includes('Rate limit exceeded')) {
          const match = errorMessage.match(/retry after (\d+) seconds/);
          if (match) {
            const seconds = parseInt(match[1]);
            errorMessage = `Rate limit exceeded. Please wait ${seconds} seconds before downloading.`;
          }
        } else if (errorMessage.includes('Network error')) {
          errorMessage = 'Network error during download. Please check your connection and try again.';
        } else if (errorMessage.includes('disk space')) {
          errorMessage = 'Insufficient disk space. Please free up space and try again.';
        } else if (errorMessage.includes('Invalid GGUF')) {
          errorMessage = 'Downloaded file is corrupted or invalid. Please try downloading again.';
        } else if (errorMessage.includes('registration failed')) {
          // Keep the detailed registration error message
        }
      }
      
      // Remove from downloads on error
      removeHfDownload(modelName);
      addToast(errorMessage, 'error');
      
      // Re-throw with enhanced message
      throw new Error(errorMessage);
    }
  };

  const cancelDownload = async (modelName: string) => {
    try {
      await cancelHfDownload(modelName);
      removeHfDownload(modelName);
      addToast('Download cancelled', 'info');
    } catch (err) {
      console.error('Cancel download error:', err);
      addToast('Failed to cancel download', 'error');
      throw err;
    }
  };

  const pauseDownload = async (modelName: string) => {
    const current = useAppStore.getState().hfDownloads.get(modelName);
    if (!current?.repo_id) {
      throw new Error('Missing repository information for this download.');
    }

    try {
      await pauseHfDownload(modelName);
      updateHfDownload(modelName, { ...current, status: 'paused' });
      addToast('Download paused', 'info');
    } catch (err) {
      console.error('Pause download error:', err);
      addToast('Failed to pause download', 'error');
      throw err;
    }
  };

  const resumeDownload = async (modelName: string) => {
    const current = useAppStore.getState().hfDownloads.get(modelName);
    if (!current?.repo_id) {
      throw new Error('Missing repository information for this download.');
    }

    try {
      updateHfDownload(modelName, { ...current, status: 'resuming' });
      await downloadHfModel(current.repo_id, current.filename, modelName, hfToken || undefined);
      addToast('Resuming download...', 'info');
    } catch (err) {
      console.error('Resume download error:', err);
      addToast('Failed to resume download', 'error');
      throw err;
    }
  };

  const refreshModels = useCallback(async () => {
    try {
      const models = await listModels();
      setInstalledModels(models);
    } catch (err) {
      console.error('Failed to refresh models:', err);
    }
  }, [setInstalledModels]);

  useEffect(() => {
    let progressUnlisten: (() => void) | null = null;
    let statusUnlisten: (() => void) | null = null;

    const setupListeners = async () => {
      // Listen to progress updates
      progressUnlisten = await listenToHfDownloadProgress((progress) => {
        updateHfDownload(progress.model_name, progress);
        
        if (progress.status === 'success' || progress.percentage >= 100) {
          setTimeout(() => {
            removeHfDownload(progress.model_name);
            refreshModels();
            addToast(`Successfully downloaded ${progress.model_name}`, 'success');
          }, 600);
        }
      });
      
      // Listen to status updates (validation, registration, etc.)
      statusUnlisten = await listenToHfDownloadStatus((status) => {
        const currentProgress = useAppStore.getState().hfDownloads.get(status.model_name);
        if (currentProgress) {
          updateHfDownload(status.model_name, { ...currentProgress, status: status.status });
        }
      });
    };

    setupListeners();

    return () => {
      if (progressUnlisten) {
        progressUnlisten();
      }
      if (statusUnlisten) {
        statusUnlisten();
      }
    };
  }, [updateHfDownload, removeHfDownload, refreshModels, addToast]);

  return {
    downloads: hfDownloads,
    downloadModel,
    pauseDownload,
    resumeDownload,
    cancelDownload,
  };
}
