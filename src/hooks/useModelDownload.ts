import { useState, useEffect } from 'react';
import { pullModel, listenToDownloadProgress, listenToHfDownloadProgress } from '../lib/tauri';
import type { DownloadProgress } from '../lib/types';
import { calculateProgress } from '../lib/utils';

interface DownloadState {
  status: string;
  percentage: number;
  isDownloading: boolean;
  error: string | null;
  downloadedBytes?: number;
  totalBytes?: number;
  speedMbps?: number;
}

export function useModelDownload(onComplete?: () => void) {
  const [downloads, setDownloads] = useState<Map<string, DownloadState>>(new Map());

  useEffect(() => {
    const setupListener = async () => {
      const unlistenDownload = await listenToDownloadProgress((progress: DownloadProgress) => {
        setDownloads((prev) => {
          const newMap = new Map(prev);
          const percentage = progress.completed && progress.total
            ? calculateProgress(progress.completed, progress.total)
            : 0;

          const existing = newMap.get(progress.model_name);
          
          newMap.set(progress.model_name, {
            status: progress.status,
            percentage,
            isDownloading: progress.status !== 'success',
            error: null,
            downloadedBytes: progress.completed ?? existing?.downloadedBytes,
            totalBytes: progress.total ?? existing?.totalBytes,
            speedMbps: existing?.speedMbps,
          });

          // Call onComplete when download finishes
          if (progress.status === 'success' && onComplete) {
            onComplete();
          }

          return newMap;
        });
      });

      const unlistenHf = await listenToHfDownloadProgress((progress) => {
        setDownloads((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(progress.model_name);

          newMap.set(progress.model_name, {
            status: existing?.status ?? 'downloading',
            percentage: Math.round(progress.percentage),
            isDownloading: true,
            error: null,
            downloadedBytes: progress.bytes_downloaded,
            totalBytes: progress.total_bytes,
            speedMbps: progress.speed_mbps,
          });

          return newMap;
        });
      });

      return () => {
        unlistenDownload();
        unlistenHf();
      };
    };

    let unlisten: (() => void) | undefined;
    setupListener().then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [onComplete]);

  const downloadModel = async (modelName: string, preferredQuantization?: string) => {
    setDownloads((prev) => {
      const newMap = new Map(prev);
      newMap.set(modelName, {
        status: 'starting',
        percentage: 0,
        isDownloading: true,
        error: null,
        downloadedBytes: 0,
        totalBytes: 0,
        speedMbps: 0,
      });
      return newMap;
    });

    try {
      await pullModel(modelName, preferredQuantization);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setDownloads((prev) => {
        const newMap = new Map(prev);
        newMap.set(modelName, {
          status: 'error',
          percentage: 0,
          isDownloading: false,
          error: errorMessage,
          downloadedBytes: 0,
          totalBytes: 0,
          speedMbps: 0,
        });
        return newMap;
      });
    }
  };

  return {
    downloads,
    downloadModel,
  };
}
