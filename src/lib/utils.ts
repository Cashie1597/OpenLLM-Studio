/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 GB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format ISO 8601 timestamp to human-readable date
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Jan 15, 2024 10:30 AM")
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate download progress percentage
 * @param completed - Number of bytes completed
 * @param total - Total number of bytes
 * @returns Percentage (0-100)
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Generate default title for new conversations
 * @param modelName - Name of the model
 * @returns Default conversation title
 */
export function generateDefaultTitle(modelName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  return `${modelName} - ${dateStr}`;
}

/**
 * Combine CSS class names, filtering out falsy values
 * @param classes - Array of class names or conditional class names
 * @returns Combined class string
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format download speed in MB/s
 * @param mbps - Speed in megabytes per second
 * @returns Formatted string (e.g., "2.5 MB/s")
 */
export function formatSpeed(mbps: number): string {
  return `${mbps.toFixed(1)} MB/s`;
}

/**
 * Format estimated time remaining
 * @param seconds - Seconds remaining
 * @returns Formatted string (e.g., "2m 30s" or "45s")
 */
export function formatETA(seconds: number | null): string {
  if (seconds === null || seconds === 0) return 'Calculating...';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Parse quantization type from filename
 * @param filename - GGUF filename
 * @returns Quantization type or null
 */
export function parseQuantizationType(filename: string): string | null {
  const patterns = [
    'Q8_0', 'Q6_K', 'Q5_K_M', 'Q5_K_S', 'Q5_1', 'Q5_0',
    'Q4_K_M', 'Q4_K_S', 'Q4_1', 'Q4_0',
    'Q3_K_L', 'Q3_K_M', 'Q3_K_S', 'Q2_K',
    'F32', 'F16'
  ];
  
  const upperFilename = filename.toUpperCase();
  for (const pattern of patterns) {
    if (upperFilename.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Get hardware compatibility badge for a model file
 * @param estimatedRamGb - Estimated RAM requirement in GB
 * @param availableVramGb - Available VRAM in GB
 * @param availableRamGb - Available system RAM in GB
 * @returns Compatibility status: 'compatible', 'marginal', or 'incompatible'
 */
export function getCompatibilityBadge(
  estimatedRamGb: number,
  availableVramGb: number,
  availableRamGb: number
): 'compatible' | 'marginal' | 'incompatible' {
  // Check if it fits in VRAM (ideal)
  if (estimatedRamGb <= availableVramGb) {
    return 'compatible';
  }
  
  // Check if it fits in system RAM (slower but works)
  if (estimatedRamGb <= availableRamGb) {
    return 'marginal';
  }
  
  // Doesn't fit in either
  return 'incompatible';
}
