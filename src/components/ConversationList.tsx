import { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';
import { LoadingSpinner } from './LoadingSpinner';

interface ConversationListProps {
  dbPath: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ dbPath, selectedId, onSelect }: ConversationListProps) {
  const { conversations, isLoading, createConversation } = useConversations(dbPath);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newModelName.trim()) {
      setError('Model name is required');
      return;
    }
    
    setError(null);
    try {
      console.log('Creating conversation with:', { dbPath, modelName: newModelName, title: newTitle });
      const conv = await createConversation(newModelName, newTitle || undefined);
      console.log('Conversation created:', conv);
      onSelect(conv.id);
      setShowNewDialog(false);
      setNewModelName('');
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-dark-border">
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-full px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white rounded-lg transition-colors"
        >
          New Conversation
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            isSelected={conv.id === selectedId}
            onSelect={() => onSelect(conv.id)}
          />
        ))}
      </div>

      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 w-96">
            <h3 className="text-dark-text font-semibold mb-4">New Conversation</h3>
            
            {error && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Model name (e.g., qwen2:q5_k_m)"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text mb-3"
            />
            
            <input
              type="text"
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-dark-accent hover:bg-dark-accent-hover text-white rounded transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewDialog(false);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-border text-dark-text rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
