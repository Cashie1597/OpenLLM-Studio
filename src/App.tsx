import { useState, useEffect } from 'react';
import { useOllamaHealth } from './hooks/useOllamaHealth';
import { useAppStore } from './store/appStore';
import { ModelLibraryPage } from './pages/ModelLibraryPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastContainer } from './components/ToastContainer';
import { BinaryDownloadPrompt } from './components/BinaryDownloadPrompt';

type Page = 'library' | 'chat' | 'settings';

function App() {
  useOllamaHealth();
  const { toasts, removeToast } = useAppStore();
  const [currentPage, setCurrentPage] = useState<Page>('library');
  const [dbPath, setDbPath] = useState<string>('');
  const [showBinaryPrompt, setShowBinaryPrompt] = useState(false);

  useEffect(() => {
    const getDbPath = async () => {
      try {
        // Use the Tauri command to get the correct database path
        const { invoke } = await import('@tauri-apps/api/core');
        const path = await invoke<string>('get_db_path');
        console.log('[App] Database path:', path);
        setDbPath(path);
      } catch (err) {
        console.error('Failed to resolve database path:', err);
        setDbPath('./openllm_studio.db');
      }
    };
    
    getDbPath();
  }, []);

  // Check if we should show binary download prompt on first run
  useEffect(() => {
    const checkBinaryStatus = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const statuses = await invoke<Array<{variant: unknown, installed: boolean}>>('get_binary_statuses');
        // Show prompt if NO binaries are installed
        const anyInstalled = statuses.some(s => s.installed === true);
        setShowBinaryPrompt(!anyInstalled);
        console.log('[App] Binary statuses:', JSON.stringify(statuses), 'anyInstalled:', anyInstalled);
      } catch (err) {
        console.error('Failed to check binary status:', err);
        // Show prompt on error so user can try
        setShowBinaryPrompt(true);
      }
    };
    
    checkBinaryStatus();
  }, []);

  // Listen for navigation events from model cards
  useEffect(() => {
    const handleNavigateToChat = () => {
      setCurrentPage('chat');
    };

    window.addEventListener('navigate-to-chat', handleNavigateToChat);
    return () => window.removeEventListener('navigate-to-chat', handleNavigateToChat);
  }, []);

  if (!dbPath) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <p className="text-dark-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-bg">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {showBinaryPrompt && (
        <BinaryDownloadPrompt onBinaryReady={() => setShowBinaryPrompt(false)} />
      )}
      
      <div className="flex h-full">
        <nav className="w-16 bg-dark-surface border-r border-dark-border flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => setCurrentPage('library')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent ${
              currentPage === 'library'
                ? 'bg-dark-accent text-white'
                : 'text-dark-text-secondary hover:bg-dark-bg'
            }`}
            title="Model Library"
            aria-label="Model Library"
            aria-current={currentPage === 'library' ? 'page' : undefined}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentPage('chat')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent ${
              currentPage === 'chat'
                ? 'bg-dark-accent text-white'
                : 'text-dark-text-secondary hover:bg-dark-bg'
            }`}
            title="Chat"
            aria-label="Chat"
            aria-current={currentPage === 'chat' ? 'page' : undefined}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent ${
              currentPage === 'settings'
                ? 'bg-dark-accent text-white'
                : 'text-dark-text-secondary hover:bg-dark-bg'
            }`}
            title="Settings"
            aria-label="Settings"
            aria-current={currentPage === 'settings' ? 'page' : undefined}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </nav>
        
        <div className="flex-1">
          {currentPage === 'library' ? (
            <ModelLibraryPage />
          ) : currentPage === 'chat' ? (
            <ChatPage dbPath={dbPath} />
          ) : (
            <SettingsPage />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
