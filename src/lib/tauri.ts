import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { HardwareInfo, HfModel, HfModelFile, HfModelDetails, HfDownloadProgress, HfDownloadStatus, OptimizationSettings, ChatOptions } from './types';

// Type definitions matching Rust structs
export interface OllamaVersion {
  version: string;
}

export interface Model {
  name: string;
  size: number;
  modified_at: string;
}

export interface LoadedModel {
  name: string;
  size: number;
}

export interface Conversation {
  id: string;
  model_name: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface DownloadProgress {
  model_name: string;
  status: string;
  completed?: number;
  total?: number;
}

export interface ChatToken {
  conversation_id: string;
  content: string;
}

// Command wrappers
export async function checkOllamaHealth(): Promise<OllamaVersion> {
  return await invoke<OllamaVersion>('check_ollama_health');
}

export async function listModels(): Promise<Model[]> {
  return await invoke<Model[]>('list_models');
}

export async function getLoadedModel(): Promise<LoadedModel | null> {
  return await invoke<LoadedModel | null>('get_loaded_model');
}

export async function getConversations(dbPath: string): Promise<Conversation[]> {
  return await invoke<Conversation[]>('get_conversations', { dbPath });
}

export async function createConversation(
  dbPath: string,
  modelName: string,
  title: string
): Promise<Conversation> {
  return await invoke<Conversation>('create_conversation', {
    dbPath,
    modelName,
    title,
  });
}

export async function getMessages(
  dbPath: string,
  conversationId: string
): Promise<Message[]> {
  return await invoke<Message[]>('get_messages', {
    dbPath,
    conversationId,
  });
}

export async function pullModel(modelName: string, preferredQuantization?: string): Promise<void> {
  return await invoke<void>('pull_model', { modelName, preferredQuantization });
}

export async function updateConversation(
  dbPath: string,
  conversationId: string,
  modelName: string,
  title: string
): Promise<Conversation> {
  return await invoke<Conversation>('update_conversation', {
    dbPath,
    conversationId,
    modelName,
    title,
  });
}

export async function deleteConversation(
  dbPath: string,
  conversationId: string
): Promise<void> {
  return await invoke<void>('delete_conversation', {
    dbPath,
    conversationId,
  });
}

export async function pullModelWithRetry(modelName: string, preferredQuantization?: string): Promise<void> {
  return await invoke<void>('pull_model_with_retry', { modelName, preferredQuantization });
}

export async function sendChatMessage(
  dbPath: string,
  conversationId: string,
  modelName: string,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string> {
  return await invoke<string>('send_chat_message', {
    dbPath,
    conversationId,
    modelName,
    messages,
    options,
  });
}

export async function stopChatGeneration(): Promise<void> {
  return await invoke<void>('stop_chat_generation');
}

export async function deleteModel(modelName: string): Promise<void> {
  return await invoke<void>('delete_model', { modelName });
}

export async function saveMessage(
  dbPath: string,
  conversationId: string,
  role: string,
  content: string
): Promise<Message> {
  return await invoke<Message>('save_message', {
    dbPath,
    conversationId,
    role,
    content,
  });
}

// Event listeners
export function listenToDownloadProgress(
  callback: (progress: DownloadProgress) => void
): Promise<() => void> {
  return listen<DownloadProgress>('download-progress', (event) => {
    callback(event.payload);
  });
}

export function listenToChatToken(
  callback: (token: ChatToken) => void
): Promise<() => void> {
  return listen<ChatToken>('chat-token', (event) => {
    callback(event.payload);
  });
}

// Hardware detection commands
export async function detectHardware(): Promise<HardwareInfo> {
  return await invoke<HardwareInfo>('detect_hardware');
}

// HuggingFace commands
export async function searchHfModels(
  query: string,
  page: number,
  hfToken?: string
): Promise<HfModel[]> {
  return await invoke<HfModel[]>('search_hf_models', {
    query,
    page,
    hfToken,
  });
}

export async function getHfModelFiles(
  repoId: string,
  hfToken?: string
): Promise<HfModelFile[]> {
  return await invoke<HfModelFile[]>('get_hf_model_files', {
    repoId,
    hfToken,
  });
}

export async function getHfModelDetails(
  repoId: string,
  hfToken?: string
): Promise<HfModelDetails> {
  return await invoke<HfModelDetails>('get_hf_model_details', {
    repoId,
    hfToken,
  });
}

export async function downloadHfModel(
  repoId: string,
  filename: string,
  modelName: string,
  hfToken?: string
): Promise<void> {
  return await invoke<void>('download_hf_model', {
    repoId,
    filename,
    modelName,
    hfToken,
  });
}

export async function cancelHfDownload(modelName: string): Promise<void> {
  return await invoke<void>('cancel_hf_download', { modelName });
}

export async function pauseHfDownload(modelName: string): Promise<void> {
  return await invoke<void>('pause_hf_download', { modelName });
}

export async function validateHfToken(token: string): Promise<string> {
  return await invoke<string>('validate_hf_token', { token });
}

// Optimization settings commands
export async function getOptimizationSettings(
  dbPath: string
): Promise<OptimizationSettings> {
  return await invoke<OptimizationSettings>('get_optimization_settings', {
    dbPath,
  });
}

export async function saveOptimizationSettings(
  dbPath: string,
  settings: OptimizationSettings
): Promise<void> {
  return await invoke<void>('save_optimization_settings', {
    dbPath,
    settings,
  });
}

// Event listeners for HuggingFace downloads
export function listenToHfDownloadProgress(
  callback: (progress: HfDownloadProgress) => void
): Promise<() => void> {
  return listen<HfDownloadProgress>('hf-download-progress', (event) => {
    callback(event.payload);
  });
}

export function listenToHfDownloadStatus(
  callback: (status: HfDownloadStatus) => void
): Promise<() => void> {
  return listen<HfDownloadStatus>('hf-download-status', (event) => {
    callback(event.payload);
  });
}

export async function getModelRecommendations(
  ramGb: number,
  vramGb: number,
  useCase: string,
  apiKey?: string,
  provider?: string,
  model?: string,
  hfToken?: string
) {
  console.log('[tauri.ts] getModelRecommendations called with:', {
    ramGb,
    vramGb,
    useCase,
    hasApiKey: !!apiKey,
    provider,
    model,
    hasHfToken: !!hfToken
  });
  
  try {
    console.log('[tauri.ts] Invoking get_model_recommendations...');
    const result = await invoke('get_model_recommendations', {
      ramGb,
      vramGb,
      useCase,
      apiKey,
      provider: provider || 'openrouter',
      model: model || undefined,
      hfToken: hfToken || undefined,
    });
    console.log('[tauri.ts] Got result:', result);
    return result;
  } catch (error) {
    console.error('[tauri.ts] Invoke failed:', error);
    throw error;
  }
}

export function listenToWizardStatus(
  callback: (status: string) => void
): Promise<() => void> {
  return listen<string>('wizard-status', (event) => {
    callback(event.payload);
  });
}
