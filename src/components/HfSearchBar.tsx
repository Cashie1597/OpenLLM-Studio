import { useRef, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface HfSearchBarProps {
  searchQuery: string;
  onChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  autoFocus?: boolean;
}

export function HfSearchBar({ searchQuery, onChange, onSearch, isSearching, autoFocus = false }: HfSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onChange('');
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && !isSearching) {
      onSearch();
    }
  };

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search HuggingFace GGUF models..."
        aria-label="Search HuggingFace models"
        className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-dark-accent focus:ring-2 focus:ring-dark-accent transition-colors"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
          <LoadingSpinner size="sm" />
        </div>
      )}
      </div>
      <button
        onClick={onSearch}
        disabled={isSearching || !searchQuery.trim()}
        className="px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Search
      </button>
    </div>
  );
}
