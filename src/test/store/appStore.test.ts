import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../store/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      toasts: [],
      installedModels: [],
      loadedModel: null,
      openRouterApiKey: null,
      claudeApiKey: null,
      openAiApiKey: null,
    });
  });

  it('adds toast', () => {
    const { addToast } = useAppStore.getState();
    addToast('Test message', 'success');

    const { toasts } = useAppStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');
  });

  it('removes toast', () => {
    const { addToast, removeToast } = useAppStore.getState();
    addToast('Test', 'info');

    const { toasts } = useAppStore.getState();
    const toastId = toasts[0].id;

    removeToast(toastId);

    const { toasts: updatedToasts } = useAppStore.getState();
    expect(updatedToasts).toHaveLength(0);
  });

  it('sets installed models', () => {
    const models = [
      { name: 'llama2:7b', size: 3825819519, modified_at: '2024-01-01', digest: 'abc' },
      { name: 'mistral:7b', size: 4109865159, modified_at: '2024-01-01', digest: 'def' },
    ];

    useAppStore.setState({ installedModels: models });

    const { installedModels } = useAppStore.getState();
    expect(installedModels).toEqual(models);
  });

  it('sets loaded model', () => {
    const model = {
      name: 'llama2:7b',
      size: 3825819519,
      size_vram: 0,
    };
    useAppStore.setState({ loadedModel: model });

    const { loadedModel } = useAppStore.getState();
    expect(loadedModel).toEqual(model);
  });

  it('sets API keys', () => {
    const { setOpenRouterApiKey, setClaudeApiKey, setOpenAiApiKey } = useAppStore.getState();

    setOpenRouterApiKey('test-openrouter-key');
    setClaudeApiKey('test-claude-key');
    setOpenAiApiKey('test-openai-key');

    const state = useAppStore.getState();
    expect(state.openRouterApiKey).toBe('test-openrouter-key');
    expect(state.claudeApiKey).toBe('test-claude-key');
    expect(state.openAiApiKey).toBe('test-openai-key');
  });
});
