import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: string;
  availableModels: string[];
  onModelChange: (model: string) => void;
  isGenerating?: boolean;
}

export function ChatInput({ 
  onSend, 
  onStop,
  disabled = false, 
  placeholder = 'Message',
  selectedModel,
  availableModels,
  onModelChange,
  isGenerating = false
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || disabled || isGenerating) return;
    
    onSend(value);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModelLabel = shortenModelName(selectedModel);

  return (
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        {/* Floating input container */}
        <div className="glass-strong rounded-2xl p-1 glow-crail-sm">
          <div className="flex items-center gap-2 bg-[#1C1C1C] rounded-xl p-2">
            {/* Model selector */}
            <div className="relative flex-shrink-0 max-w-[240px]">
              <span
                className="pointer-events-none absolute left-3 right-8 top-1/2 -translate-y-1/2 truncate text-[#B1ADA1] text-xs font-medium"
                title={selectedModel}
              >
                {selectedModelLabel}
              </span>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={disabled || isGenerating}
                className="appearance-none h-10 w-[240px] px-3 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333] hover:border-[#C15F3C] rounded-lg text-transparent focus:outline-none focus:border-[#C15F3C] transition-all disabled:opacity-50 pr-8 cursor-pointer"
                title={selectedModel}
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isGenerating}
              placeholder={isGenerating ? "Generating..." : placeholder}
              className="flex-1 px-4 py-2.5 bg-transparent text-white text-sm placeholder-[#6B6B6B] resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '150px' }}
            />

            {/* Send button */}
            <button
              onClick={isGenerating ? onStop : handleSend}
              disabled={disabled || (!isGenerating && !value.trim())}
              className="h-10 w-10 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#C15F3C] flex-shrink-0 flex items-center justify-center"
              title={isGenerating ? 'Stop generating' : 'Send'}
            >
              {isGenerating ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Hint text */}
        <p className="text-center text-[#6B6B6B] text-xs mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function shortenModelName(model: string): string {
  const base = model.split(':')[0];
  if (base.length <= 28) {
    return base;
  }

  return `${base.slice(0, 28)}...`;
}
