import type { HfDownloadProgress } from '../lib/types';
import { formatBytes, formatSpeed, formatETA } from '../lib/utils';

interface DownloadQueueProps {
  downloads: Map<string, HfDownloadProgress>;
  onPause: (modelName: string) => void;
  onResume: (modelName: string) => void;
  onCancel: (modelName: string) => void;
}

export function DownloadQueue({ downloads, onPause, onResume, onCancel }: DownloadQueueProps) {
  const downloadArray = Array.from(downloads.values());

  if (downloadArray.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-dark-text font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-dark-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Active Downloads
        </h3>
        <span className="text-sm text-dark-text-secondary">
          {downloadArray.length} {downloadArray.length === 1 ? 'download' : 'downloads'}
        </span>
      </div>

      <div className="space-y-3">
        {downloadArray.map((download) => (
          <DownloadQueueItem
            key={download.model_name}
            download={download}
            onPause={() => onPause(download.model_name)}
            onResume={() => onResume(download.model_name)}
            onCancel={() => onCancel(download.model_name)}
          />
        ))}
      </div>
    </div>
  );
}

interface DownloadQueueItemProps {
  download: HfDownloadProgress;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function DownloadQueueItem({ download, onPause, onResume, onCancel }: DownloadQueueItemProps) {
  const isComplete = download.percentage >= 100;
  const hasStatus = download.status && download.status.length > 0;
  const isPaused = download.status === 'paused';

  return (
    <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-dark-text text-sm font-medium truncate" title={download.model_name}>
            {download.model_name}
          </h4>
          <p className="text-dark-text-secondary text-xs truncate" title={download.filename}>
            {download.filename}
          </p>
        </div>
        
        {!isComplete && (
          <div className="ml-2 flex items-center gap-1">
            {isPaused ? (
              <button
                onClick={onResume}
                className="p-1 text-dark-text-secondary hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-label={`Resume download of ${download.model_name}`}
                title="Resume download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.518-3.717A1 1 0 007 8.32v7.36a1 1 0 001.234.97l6.518-1.86A1 1 0 0015 14.82v-3.14a1 1 0 00-.248-.652z" />
                </svg>
              </button>
            ) : !hasStatus || download.status === 'downloading' || download.status === 'resuming' ? (
              <button
                onClick={onPause}
                className="p-1 text-dark-text-secondary hover:text-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                aria-label={`Pause download of ${download.model_name}`}
                title="Pause download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              </button>
            ) : null}
            <button
              onClick={onCancel}
              className="p-1 text-dark-text-secondary hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label={`Stop download of ${download.model_name}`}
              title="Stop download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {hasStatus ? (
        <div className={`flex items-center gap-2 text-sm ${isPaused ? 'text-yellow-500' : 'text-dark-accent'}`}>
          {!isPaused && (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{download.status}</span>
        </div>
      ) : isComplete ? (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Download complete</span>
        </div>
      ) : (
        <>
          <div className="w-full bg-dark-surface rounded-full h-1.5 mb-2">
            <div
              className="bg-dark-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${download.percentage}%` }}
              role="progressbar"
              aria-valuenow={download.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Download progress: ${download.percentage.toFixed(1)}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-dark-text-secondary">
            <span className="font-medium">{download.percentage.toFixed(1)}%</span>
            <span>
              {formatBytes(download.bytes_downloaded)} / {formatBytes(download.total_bytes)}
            </span>
            <span>{formatSpeed(download.speed_mbps)}</span>
            {download.eta_seconds !== null && (
              <span>ETA: {formatETA(download.eta_seconds)}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
