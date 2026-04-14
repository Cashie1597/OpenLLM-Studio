import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHardwareInfo } from '../../hooks/useHardwareInfo';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

describe('useHardwareInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects hardware on mount', async () => {
    const mockHardware = {
      total_ram_gb: 16,
      available_ram_gb: 8,
      gpu_info: {
        name: 'NVIDIA RTX 3080',
        vram_gb: 10,
      },
      cpu_cores: 8,
    };

    vi.mocked(invoke).mockResolvedValue(mockHardware);

    const { result } = renderHook(() => useHardwareInfo());

    expect(result.current.isDetecting).toBe(true);

    await waitFor(() => {
      expect(result.current.isDetecting).toBe(false);
    });

    expect(result.current.hardwareInfo).toEqual(mockHardware);
    expect(invoke).toHaveBeenCalledWith('detect_hardware');
  });

  it('handles detection error', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Detection failed'));

    const { result } = renderHook(() => useHardwareInfo());

    await waitFor(() => {
      expect(result.current.isDetecting).toBe(false);
    });

    expect(result.current.hardwareInfo).toBeNull();
  });

  it('redetects hardware when redetect is called', async () => {
    const mockHardware = { total_ram_gb: 16 };
    vi.mocked(invoke).mockResolvedValue(mockHardware);

    const { result } = renderHook(() => useHardwareInfo());

    await waitFor(() => {
      expect(result.current.isDetecting).toBe(false);
    });

    vi.mocked(invoke).mockClear();
    
    await result.current.redetect();

    expect(invoke).toHaveBeenCalledWith('detect_hardware');
  });
});
