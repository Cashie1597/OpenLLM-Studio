import { useModels } from '../hooks/useModels';
import { useModelDownload } from '../hooks/useModelDownload';
import { useModelDelete } from '../hooks/useModelDelete';
import { CURATED_MODELS } from '../lib/constants';
import { ModelCard } from './ModelCard';
import { ErrorBanner } from './ErrorBanner';
import { LoadingSpinner } from './LoadingSpinner';

export function ModelLibrary() {
  const { installedModels, isLoading, error, refreshModels } = useModels();
  const { downloads, downloadModel } = useModelDownload(refreshModels);
  const { deleteModel, error: deleteError } = useModelDelete(refreshModels);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dark-text mb-2">Browse Models</h2>
        <p className="text-dark-text-secondary">
          Discover and download curated AI models optimized for local execution
        </p>
      </div>
      
      {(error || deleteError) && (
        <div className="mb-6">
          <ErrorBanner message={error || deleteError || ''} onRetry={refreshModels} />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CURATED_MODELS.map((model) => {
          const isInstalled = installedModels.some((m) => m.name === model.name);
          const downloadProgress = downloads.get(model.name);
          
          return (
            <ModelCard
              key={model.name}
              model={model}
              isInstalled={isInstalled}
              downloadProgress={downloadProgress}
              onDownload={downloadModel}
              onDelete={deleteModel}
            />
          );
        })}
      </div>
    </div>
  );
}
