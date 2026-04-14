import type { Conversation } from '../lib/types';
import { formatTimestamp } from '../lib/utils';
import { cn } from '../lib/utils';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConversationListItem({ conversation, isSelected, onSelect }: ConversationListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-colors',
        isSelected
          ? 'bg-dark-accent text-white'
          : 'bg-dark-surface hover:bg-dark-bg text-dark-text'
      )}
    >
      <div className="font-semibold text-sm mb-1">{conversation.title}</div>
      <div className={cn(
        'text-xs',
        isSelected ? 'text-white/70' : 'text-dark-text-secondary'
      )}>
        {conversation.model_name}
      </div>
      <div className={cn(
        'text-xs mt-1',
        isSelected ? 'text-white/50' : 'text-dark-text-secondary'
      )}>
        {formatTimestamp(conversation.updated_at)}
      </div>
    </button>
  );
}
