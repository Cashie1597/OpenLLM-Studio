import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../../components/ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    disabled: false,
    selectedModel: 'llama2:7b',
    availableModels: ['llama2:7b', 'mistral:7b'],
    onModelChange: vi.fn(),
  };

  it('renders textarea', () => {
    render(<ChatInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/message/i);
    expect(textarea).toBeInTheDocument();
  });

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);
    
    const textarea = screen.getByPlaceholderText(/message/i);
    fireEvent.change(textarea, { target: { value: 'Hello AI' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(onSend).toHaveBeenCalledWith('Hello AI');
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled={true} />);
    const textarea = screen.getByPlaceholderText(/message/i);
    expect(textarea).toBeDisabled();
  });

  it('clears input after sending', () => {
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);
    
    const textarea = screen.getByPlaceholderText(/message/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(textarea.value).toBe('');
  });
});
