export interface CuratedModel {
  name: string;
  displayName: string;
  description: string;
  size: string;
  parameters: string;
}

export const CURATED_MODELS: CuratedModel[] = [
  {
    name: 'qwen2.5:0.5b',
    displayName: 'Qwen 2.5 0.5B',
    description: 'Lightweight model for basic tasks',
    size: '397 MB',
    parameters: '0.5B',
  },
  {
    name: 'qwen2.5:3b',
    displayName: 'Qwen 2.5 3B',
    description: 'Balanced performance and efficiency',
    size: '1.9 GB',
    parameters: '3B',
  },
  {
    name: 'gemma2:2b',
    displayName: 'Gemma 2 2B',
    description: "Google's efficient model",
    size: '1.6 GB',
    parameters: '2B',
  },
  {
    name: 'gemma2:9b',
    displayName: 'Gemma 2 9B',
    description: 'High-quality responses',
    size: '5.4 GB',
    parameters: '9B',
  },
  {
    name: 'deepseek-r1:1.5b',
    displayName: 'DeepSeek R1 1.5B',
    description: 'Reasoning-focused model',
    size: '1.1 GB',
    parameters: '1.5B',
  },
  {
    name: 'deepseek-r1:7b',
    displayName: 'DeepSeek R1 7B',
    description: 'Advanced reasoning capabilities',
    size: '4.7 GB',
    parameters: '7B',
  },
  {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 1B',
    description: "Meta's compact model",
    size: '1.3 GB',
    parameters: '1B',
  },
  {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    description: "Meta's versatile model",
    size: '2.0 GB',
    parameters: '3B',
  },
  {
    name: 'mistral:7b',
    displayName: 'Mistral 7B',
    description: 'High-performance open model',
    size: '4.1 GB',
    parameters: '7B',
  },
  {
    name: 'phi4:14b',
    displayName: 'Phi-4 14B',
    description: "Microsoft's reasoning model",
    size: '9.1 GB',
    parameters: '14B',
  },
  {
    name: 'llama3.3:70b',
    displayName: 'Llama 3.3 70B',
    description: "Meta's flagship model",
    size: '43 GB',
    parameters: '70B',
  },
  {
    name: 'devstral:22b',
    displayName: 'Devstral 22B',
    description: 'Code-specialized model',
    size: '13 GB',
    parameters: '22B',
  },
];
