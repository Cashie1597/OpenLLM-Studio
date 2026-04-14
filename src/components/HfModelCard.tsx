import type { HfModel } from '../lib/types';
import { formatTimestamp } from '../lib/utils';

interface HfModelCardProps {
  model: HfModel;
  onSelect: () => void;
  isSelected: boolean;
}

export function HfModelCard({ model, onSelect, isSelected }: HfModelCardProps) {
  const hasStrongQuant = model.tags.some((tag) => /q5|q6|q8|q4_k_m/i.test(tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`bg-dark-surface border rounded-lg p-4 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent ${
        isSelected
          ? 'border-dark-accent bg-dark-accent/10'
          : 'border-dark-border hover:border-dark-accent'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-dark-text font-semibold truncate">{model.id}</h3>
        {hasStrongQuant && (
          <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-semibold rounded-full whitespace-nowrap">
            Strong GGUF
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4 mb-2 text-sm text-dark-text-secondary">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{model.downloads.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{model.likes.toLocaleString()}</span>
        </div>
      </div>
      
      <p className="text-dark-text-secondary text-xs mb-2">
        Updated: {formatTimestamp(model.last_modified)}
      </p>
      
      {model.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-dark-bg text-dark-text-secondary text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {model.tags.length > 3 && (
            <span className="px-2 py-0.5 text-dark-text-secondary text-xs">
              +{model.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
