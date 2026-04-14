import type { HfModelFile, HfDownloadProgress, HardwareInfo, Model } from '../lib/types';
import { HfModelFileItem } from './HfModelFileItem';

interface HfModelFileListProps {
  repoId: string;
  files: HfModelFile[];
  hardwareInfo: HardwareInfo | null;
  onDownload: (filename: string) => void;
  downloads: Map<string, HfDownloadProgress>;
  installedModels: Model[];
}

export function HfModelFileList({ repoId, files, hardwareInfo, onDownload, downloads, installedModels }: HfModelFileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-dark-text-secondary">
        No GGUF files found for this model
      </div>
    );
  }

  // Group files by quantization quality (already sorted from backend)
  const recommendedQuantization = hardwareInfo
    ? getRecommendedQuantization(hardwareInfo.vram_gb)
    : null;

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const isRecommended = recommendedQuantization && file.quantization?.includes(recommendedQuantization);
        const modelName = deriveModelName(repoId, file.filename);
        const isInstalled = installedModels.some((installed) => installed.name === modelName);
        
        return (
          <div key={file.filename} className={isRecommended ? 'ring-2 ring-dark-accent rounded-lg' : ''}>
            {isRecommended && (
              <div className="px-3 py-1 bg-dark-accent text-white text-xs font-medium rounded-t-lg">
                Recommended for your hardware
              </div>
            )}
            <HfModelFileItem
              file={file}
              hardwareInfo={hardwareInfo}
              onDownload={() => onDownload(file.filename)}
              downloadProgress={Array.from(downloads.values()).find(
                (d) => d.model_name === modelName
              )}
              isInstalled={isInstalled}
            />
          </div>
        );
      })}
    </div>
  );
}

function getRecommendedQuantization(vramGb: number): string | null {
  if (vramGb >= 10.0) return 'Q6_K';
  if (vramGb >= 6.0) return 'Q5_K_M';
  if (vramGb >= 4.0) return 'Q4_K_M';
  return 'Q3_K_M';
}

function deriveModelName(repoId: string, filename: string): string {
  const baseName = repoId.split('/').pop() || repoId;
  const quantization = filename.match(/Q\d+_K_[MSL]|Q\d+_\d+|Q\d+|F\d+/i)?.[0] || '';
  return `${baseName}-${quantization}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
