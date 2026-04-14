import type { CuratedModel } from '../lib/constants';

interface ModelCardProps {
  model: CuratedModel;
  isInstalled: boolean;
  downloadProgress?: { status: string; percentage: number; isDownloading: boolean };
  onDownload: (modelName: string) => void;
  onDelete: (modelName: string) => void;
  onUseInChat?: (modelName: string) => void;
}

export function ModelCard({ model, isInstalled, downloadProgress, onDownload, onDelete, onUseInChat }: ModelCardProps) {
  const isDownloading = downloadProgress?.isDownloading || false;

  const handleUseInChat = () => {
    if (onUseInChat) {
      onUseInChat(model.name);
    } else {
      // Fallback: store in localStorage and dispatch event
      localStorage.setItem('selected-model', model.name);
      window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { model: model.name } }));
    }
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-dark-accent hover:shadow-glow-sm transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-dark-text font-semibold">{model.displayName}</h3>
            {isInstalled && (
              <span className="px-2 py-0.5 bg-dark-success bg-opacity-20 text-dark-success text-xs rounded-full">
                Installed
              </span>
            )}
          </div>
          <span className="text-dark-text-muted text-sm">{model.parameters}</span>
        </div>
      </div>
      
      <p className="text-dark-text-secondary text-sm mb-4 line-clamp-2">{model.description}</p>
      
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-dark-text-secondary">{model.size}</span>
        <div className="flex items-center gap-1 text-dark-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs">Fast</span>
        </div>
      </div>
      
      {isDownloading ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-text-secondary text-xs">{downloadProgress?.status}</span>
            <span className="text-dark-accent text-xs font-semibold">{downloadProgress?.percentage}%</span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-dark-accent to-dark-accent-light h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress?.percentage || 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {isInstalled ? (
            <>
              <button
                onClick={() => onDelete(model.name)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-danger hover:text-white border border-dark-border hover:border-dark-danger text-dark-text-secondary text-sm rounded-lg transition-all"
              >
                Delete
              </button>
              <button
                onClick={handleUseInChat}
                className="px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white text-sm rounded-lg transition-colors"
                title="Use in chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => onDownload(model.name)}
              className="w-full px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          )}
        </div>
      )}
    </div>
  );
}
