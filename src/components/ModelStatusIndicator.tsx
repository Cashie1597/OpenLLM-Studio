import { useLoadedModel } from '../hooks/useLoadedModel';
import { formatBytes } from '../lib/utils';

export function ModelStatusIndicator() {
  const { loadedModel, isLoading } = useLoadedModel();

  if (isLoading) {
    return (
      <div className="text-[#B1ADA1] text-sm">
        Checking...
      </div>
    );
  }

  if (!loadedModel) {
    return (
      <div className="text-[#B1ADA1] text-sm">
        Idle
      </div>
    );
  }

  return (
    <div className="text-white text-sm">
      <span className="font-semibold">{loadedModel.name}</span>
      <span className="text-[#B1ADA1] ml-2">
        ({formatBytes(loadedModel.size)})
      </span>
    </div>
  );
}
