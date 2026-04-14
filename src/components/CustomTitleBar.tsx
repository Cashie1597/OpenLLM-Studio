import { getCurrentWindow } from '@tauri-apps/api/window';

export function CustomTitleBar() {
  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    getCurrentWindow().toggleMaximize();
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-4 select-none"
    >
      {/* Logo and title */}
      <div className="flex items-center gap-2.5">
        <img 
          src="/logo.png" 
          alt="OpenLLM Studio" 
          className="w-10 h-10 rounded-md object-contain"
        />
        <span className="text-white font-medium text-sm">OpenLLM Studio</span>
      </div>
      
      {/* Window controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center hover:bg-[#1F1F1F] rounded-md transition-colors"
          aria-label="Minimize"
        >
          <svg className="w-3.5 h-3.5 text-[#B1ADA1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center hover:bg-[#1F1F1F] rounded-md transition-colors"
          aria-label="Maximize"
        >
          <svg className="w-3.5 h-3.5 text-[#B1ADA1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center hover:bg-[#c45c5c] rounded-md transition-colors group"
          aria-label="Close"
        >
          <svg className="w-3.5 h-3.5 text-[#B1ADA1] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
