import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export type BinaryVariant = 'Cpu' | 'Cuda12_4' | 'Cuda13_1' | 'Vulkan' | 'Sycl' | 'Metal';

export interface BinaryStatus {
  variant: string; // Rust unit-variant enums serialize as plain strings
  installed: boolean;
  version: string | null;
  path: string | null;
}

export interface DownloadProgress {
  variant: string;
  bytes_downloaded: number;
  total_bytes: number;
  percentage: number;
}

/** Extract the variant key string regardless of how Rust serialized it */
function extractVariantKey(variant: unknown): string {
  if (typeof variant === 'string') return variant;
  if (typeof variant === 'object' && variant !== null) return Object.keys(variant)[0] || 'Unknown';
  return 'Unknown';
}

export function useBinaryManager() {
  const [recommendedVariant, setRecommendedVariant] = useState<BinaryVariant | null>(null);
  const [statuses, setStatuses] = useState<BinaryStatus[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for download progress
    const unlisten = listen<DownloadProgress>('binary-download-progress', (event) => {
      setProgress(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const loadStatuses = useCallback(async () => {
    try {
      const [recommended, currentStatuses] = await Promise.all([
        invoke<unknown>('get_recommended_binary'),
        invoke<BinaryStatus[]>('get_binary_statuses'),
      ]);
      // Normalize the variant key — Rust unit enums serialize as strings
      const recKey = extractVariantKey(recommended) as BinaryVariant;
      const normalizedStatuses = currentStatuses.map(s => ({
        ...s,
        variant: extractVariantKey(s.variant),
      }));
      setRecommendedVariant(recKey);
      setStatuses(normalizedStatuses);
    } catch (e) {
      setError(`Failed to load binary statuses: ${e}`);
    }
  }, []);

  const downloadBinary = useCallback(async (variant: BinaryVariant) => {
    setDownloading(true);
    setError(null);
    
    try {
      // Send the variant as a plain string
      await invoke('download_binary', { variant });
      await loadStatuses();
      return true;
    } catch (e) {
      setError(`Download failed: ${e}`);
      return false;
    } finally {
      setDownloading(false);
    }
  }, [loadStatuses]);

  const isInstalled = useCallback((variant: BinaryVariant) => {
    return statuses.some(s => s.variant === variant && s.installed);
  }, [statuses]);

  const isRecommendedInstalled = useCallback(() => {
    if (!recommendedVariant) return false;
    return isInstalled(recommendedVariant);
  }, [recommendedVariant, isInstalled]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  return {
    recommendedVariant,
    statuses,
    downloading,
    progress,
    error,
    downloadBinary,
    isInstalled,
    isRecommendedInstalled,
    loadStatuses,
  };
}
