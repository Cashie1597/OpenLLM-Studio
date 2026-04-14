import { useOllamaHealth } from '../hooks/useOllamaHealth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function OnboardingScreen() {
  const { isChecking, retry } = useOllamaHealth();

  return (
    <div className="flex items-center justify-center h-screen bg-dark-bg">
      <div className="max-w-md p-8 bg-dark-surface border border-dark-border rounded-lg">
        <h1 className="text-2xl font-bold text-dark-text mb-4">Welcome to OpenLLM Studio</h1>
        
        <p className="text-dark-text-secondary mb-6">
          The embedded local runtime is not ready yet. Check your bundled runtime files and try again.
        </p>
        
        <div className="bg-dark-bg border border-dark-border rounded p-4 mb-6">
          <p className="text-dark-text text-sm">
            OpenLLM Studio now uses its own local runtime, so no separate Ollama install is required.
          </p>
        </div>
        
        <button
          onClick={retry}
          disabled={isChecking}
          className="w-full px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isChecking ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Checking...</span>
            </>
          ) : (
            'Retry Runtime Check'
          )}
        </button>
      </div>
    </div>
  );
}
