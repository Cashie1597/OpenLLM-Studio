import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModels } from '../../hooks/useModels';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

describe('useModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches models on mount', async () => {
    const mockModels = [
      { name: 'llama2:7b', size: 3825819519, modified_at: '2024-01-01', digest: 'abc' },
      { name: 'mistral:7b', size: 4109865159, modified_at: '2024-01-01', digest: 'def' },
    ];

    vi.mocked(invoke).mockResolvedValue(mockModels);

    const { result } = renderHook(() => useModels());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.installedModels).toEqual(mockModels);
    expect(invoke).toHaveBeenCalledWith('list_models');
  });

  it('handles fetch error', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useModels());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.installedModels).toEqual([]);
  });

  it('refreshes models when refreshModels is called', async () => {
    const mockModels = [{ name: 'llama2:7b', size: 3825819519, modified_at: '2024-01-01', digest: 'abc' }];
    vi.mocked(invoke).mockResolvedValue(mockModels);

    const { result } = renderHook(() => useModels());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.mocked(invoke).mockClear();
    
    await result.current.refreshModels();

    expect(invoke).toHaveBeenCalledWith('list_models');
  });
});
