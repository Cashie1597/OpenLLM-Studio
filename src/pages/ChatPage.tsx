import { useEffect, useMemo, useState } from 'react';
import { CustomTitleBar } from '../components/CustomTitleBar';
import { ChatInterface } from '../components/ChatInterface';
import { useAppStore } from '../store/appStore';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { deleteConversation, updateConversation } from '../lib/tauri';

interface ChatPageProps {
  dbPath: string;
}

export function ChatPage({ dbPath }: ChatPageProps) {
  const { installedModels } = useAppStore();
  const { conversations, createConversation, refreshConversations, isLoading: isLoadingConversations } = useConversations(dbPath);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { messages, isLoading: isLoadingMessages, refreshMessages } = useMessages(dbPath, currentConversationId);

  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );

  const createNewSession = async () => {
    if (installedModels.length === 0) {
      return;
    }

    const newConversation = await createConversation(installedModels[0].name, 'New Chat');
    setCurrentConversationId(newConversation.id);
  };

  const patchConversation = async (updates: { title?: string; model_name?: string }) => {
    if (!currentConversation) return;
    const nextTitle = updates.title ?? currentConversation.title;
    const nextModel = updates.model_name ?? currentConversation.model_name;
    await updateConversation(dbPath, currentConversation.id, nextModel, nextTitle);
    await refreshConversations();
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(dbPath, id);
    await refreshConversations();

    if (currentConversationId === id) {
      const remaining = conversations.filter((conversation) => conversation.id !== id);
      setCurrentConversationId(remaining[0]?.id ?? null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      <CustomTitleBar />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-[#2A2A2A] flex flex-col bg-[#111111]">
          <div className="p-3">
            <button
              onClick={createNewSession}
              disabled={installedModels.length === 0}
              className="w-full px-4 py-2.5 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {isLoadingConversations ? (
              <div className="text-center py-8">
                <p className="text-[#B1ADA1] text-xs">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#B1ADA1] text-xs">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group relative rounded-xl transition-all ${
                      currentConversationId === conversation.id
                        ? 'bg-[#1C1C1C] border border-[#333333]'
                        : 'hover:bg-[#1C1C1C] border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentConversationId(conversation.id)}
                      className="w-full text-left px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#B1ADA1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className={`${currentConversationId === conversation.id ? 'text-white' : 'text-[#B1ADA1]'} truncate`}>
                          {conversation.title}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteConversation(conversation.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#2A2A2A] transition-all"
                    >
                      <svg className="w-3.5 h-3.5 text-[#B1ADA1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#B1ADA1]">
              <div className="w-2 h-2 rounded-full bg-[#5a9a6e]"></div>
              <span>{installedModels.length} models available</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#0A0A0A]">
          {currentConversation ? (
            <ChatInterface
              dbPath={dbPath}
              conversation={currentConversation}
              messages={messages}
              availableModels={installedModels.map((model) => model.name)}
              isLoadingMessages={isLoadingMessages}
              onRefreshMessages={async () => {
                await refreshMessages();
                await refreshConversations();
              }}
              onConversationPatched={patchConversation}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] flex items-center justify-center glow-crail">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Welcome to OpenLLM Studio</h2>
                <p className="text-[#B1ADA1] text-sm mb-6">
                  Your private AI workspace running entirely on your machine
                </p>
                <button
                  onClick={createNewSession}
                  disabled={installedModels.length === 0}
                  className="px-6 py-3 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start a conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
