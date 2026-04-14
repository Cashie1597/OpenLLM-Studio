// Type definitions matching Rust structs exactly

export interface Model {
  name: string;
  size: number;
  modified_at: string;
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

export interface OllamaVersion {
  version: string;
}

export interface LoadedModel {
  name: string;
  size: number;
}

export interface CuratedModel {
  name: string;
  displayName: string;
  description: string;
  size: string;
  parameters: string;
}

// Hardware detection types
export interface HardwareInfo {
  gpu_name: string;
  gpu_backend: 'nvidia' | 'amd' | 'intel' | 'apple_metal' | 'cpu_only';
  vram_gb: number;
  ram_gb: number;
  cpu_cores: number;
}

// HuggingFace types
export interface HfModel {
  id: string;
  downloads: number;
  likes: number;
  last_modified: string;
  tags: string[];
}

export interface HfModelDetails {
  id: string;
  author: string | null;
  description: string | null;
  downloads: number;
  likes: number;
  last_modified: string;
  tags: string[];
  pipeline_tag: string | null;
  license: string | null;
}

export interface HfModelFile {
  filename: string;
  size: number;
  quantization: string | null;
  estimated_ram_gb: number;
}

export interface HfDownloadProgress {
  model_name: string;
  repo_id?: string;
  filename: string;
  bytes_downloaded: number;
  total_bytes: number;
  speed_mbps: number;
  percentage: number;
  eta_seconds: number | null;
  status?: string; // Optional status message for post-download steps
}

export interface HfDownloadStatus {
  model_name: string;
  status: string;
}

// Optimization types
export interface OptimizationSettings {
  num_ctx: number;
  num_gpu: number;
  num_batch: number;
  num_thread: number;
  flash_attention: boolean;
  recommended_quantization: string;
}

export interface ChatOptions {
  temperature?: number;
  num_predict?: number;
  num_ctx?: number;
  num_gpu?: number;
  num_batch?: number;
  num_thread?: number;
}
