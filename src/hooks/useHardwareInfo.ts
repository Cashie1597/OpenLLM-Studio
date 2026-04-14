import { useState, useEffect } from 'react';
import { detectHardware } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useHardwareInfo() {
  const { hardwareInfo, setHardwareInfo } = useAppStore();
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      const info = await detectHardware();
      setHardwareInfo(info);
      
      // Check for incomplete detection and warn user
      if (info.gpu_backend === 'cpu_only' && info.vram_gb === 0) {
        console.warn('Hardware detection: No GPU detected or GPU detection failed. Running in CPU-only mode.');
      }
      
      if (info.ram_gb === 8.0) {
        console.warn('Hardware detection: RAM detection may have failed. Using default value of 8GB.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect hardware';
      setError(errorMessage);
      console.error('Hardware detection error:', err);
      
      // Set fallback hardware info
      setHardwareInfo({
        gpu_name: 'CPU Only',
        gpu_backend: 'cpu_only',
        vram_gb: 0,
        ram_gb: 8.0,
        cpu_cores: 4,
      });
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (!hardwareInfo) {
      detect();
    }
  }, []);

  return {
    hardwareInfo,
    isDetecting,
    error,
    redetect: detect,
  };
}
