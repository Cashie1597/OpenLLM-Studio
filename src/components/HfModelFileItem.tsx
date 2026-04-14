import type { HfModelFile, HfDownloadProgress, HardwareInfo } from '../lib/types';
import { formatBytes, getCompatibilityBadge, formatSpeed, formatETA } from '../lib/utils';

interface HfModelFileItemProps {
  file: HfModelFile;
  hardwareInfo: HardwareInfo | null;
  onDownload: () => void;
  downloadProgress?: HfDownloadProgress;
  isInstalled?: boolean;
}

export function HfModelFileItem({ file, hardwareInfo, onDownload, downloadProgress, isInstalled = false }: HfModelFileItemProps) {
  const isDownloading = !!downloadProgress;
  
  const compatibilityBadge = hardwareInfo
    ? getCompatibilityBadge(file.estimated_ram_gb, hardwareInfo.vram_gb, hardwareInfo.ram_gb)
    : null;

  const badgeConfig = {
    compatible: { label: 'Best for your GPU', color: 'bg-green-600' },
    marginal: { label: 'CPU compatible', color: 'bg-yellow-600' },
    incompatible: { label: 'May not fit', color: 'bg-red-600' },
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-dark-text font-medium mb-1">{file.filename}</h4>
          <div className="flex items-center gap-3 text-sm text-dark-text-secondary">
            <span>{formatBytes(file.size)}</span>
            {file.quantization && (
              <span className="px-2 py-0.5 bg-dark-bg text-dark-accent text-xs rounded font-mono">
                {file.quantization}
              </span>
            )}
            <span>~{file.estimated_ram_gb.toFixed(1)} GB RAM</span>
          </div>
        </div>
        
        {compatibilityBadge && (
          <span className={`px-2 py-1 ${badgeConfig[compatibilityBadge].color} text-white text-xs rounded`}>
            {badgeConfig[compatibilityBadge].label}
          </span>
        )}
      </div>
      
      {isInstalled ? (
        <div className="w-full px-3 py-2 bg-green-600/15 border border-green-600/30 text-green-400 text-sm rounded text-center">
          Installed
        </div>
      ) : isDownloading ? (
        <div className="space-y-2">
          <div className="w-full bg-dark-bg rounded-full h-2">
            <div
              className="bg-dark-accent h-2 rounded-full transition-all"
              style={{ width: `${downloadProgress.percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-dark-text-secondary">
            <span>{downloadProgress.percentage.toFixed(1)}%</span>
            <span>{formatBytes(downloadProgress.bytes_downloaded)} / {formatBytes(downloadProgress.total_bytes)}</span>
            <span>{formatSpeed(downloadProgress.speed_mbps)}</span>
            <span>ETA: {formatETA(downloadProgress.eta_seconds)}</span>
          </div>
          <button
            onClick={onDownload}
            className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-surface"
            aria-label="Cancel download"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onDownload}
          className="w-full px-3 py-1 bg-dark-accent hover:bg-dark-accent-hover text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface"
          aria-label={`Download ${file.filename}`}
        >
          Download
        </button>
      )}
    </div>
  );
}
