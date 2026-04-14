import { useState, useEffect } from 'react';
import { getOptimizationSettings, saveOptimizationSettings } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import type { OptimizationSettings } from '../lib/types';
import { resolveResource } from '@tauri-apps/api/path';

export function useOptimizationSettings() {
  const { optimizationSettings, setOptimizationSettings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbPath, setDbPath] = useState<string | null>(null);

  useEffect(() => {
    const getDbPath = async () => {
      try {
        const path = await resolveResource('openllm_studio.db');
        setDbPath(path);
      } catch (err) {
        console.error('Failed to resolve database path:', err);
        setDbPath('./openllm_studio.db');
      }
    };
    
    getDbPath();
  }, []);

  const loadSettings = async () => {
    if (!dbPath) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const settings = await getOptimizationSettings(dbPath);
      setOptimizationSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load optimization settings';
      setError(errorMessage);
      console.error('Load settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (settings: OptimizationSettings) => {
    if (!dbPath) {
      throw new Error('Database path not resolved');
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await saveOptimizationSettings(dbPath, settings);
      setOptimizationSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save optimization settings';
      setError(errorMessage);
      console.error('Save settings error:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (dbPath && !optimizationSettings) {
      loadSettings();
    }
  }, [dbPath]);

  return {
    settings: optimizationSettings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    reloadSettings: loadSettings,
  };
}
