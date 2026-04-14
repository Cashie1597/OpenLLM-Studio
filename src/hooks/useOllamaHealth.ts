import { useEffect, useState } from 'react';
import { checkOllamaHealth } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useOllamaHealth() {
  const [isChecking, setIsChecking] = useState(true);
  const { ollamaConnected, ollamaVersion, setOllamaConnected, setOllamaVersion } = useAppStore();

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const version = await checkOllamaHealth();
      setOllamaConnected(true);
      setOllamaVersion(version.version);
    } catch (error) {
      setOllamaConnected(false);
      setOllamaVersion(null);
      console.error('Local runtime health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return {
    ollamaConnected,
    ollamaVersion,
    isChecking,
    retry: checkHealth,
  };
}
