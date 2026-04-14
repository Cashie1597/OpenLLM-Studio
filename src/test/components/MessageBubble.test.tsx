import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../components/MessageBubble';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    const message = {
      id: '1',
      conversation_id: 'conv1',
      role: 'user' as const,
      content: 'Hello, how are you?',
      created_at: '2024-01-01T12:00:00',
    };
    
    render(<MessageBubble message={message} />);
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const message = {
      id: '2',
      conversation_id: 'conv1',
      role: 'assistant' as const,
      content: "I'm doing well, thank you!",
      created_at: '2024-01-01T12:00:00',
    };
    
    render(<MessageBubble message={message} />);
    expect(screen.getByText("I'm doing well, thank you!")).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    const message = {
      id: '1',
      conversation_id: 'conv1',
      role: 'user' as const,
      content: 'Test',
      created_at: '2024-01-01T12:00:00',
    };
    
    const { container } = render(<MessageBubble message={message} />);
    const bubble = container.querySelector('.bg-\\[\\#C15F3C\\]');
    expect(bubble).toBeInTheDocument();
  });

  it('applies correct styling for assistant messages', () => {
    const message = {
      id: '2',
      conversation_id: 'conv1',
      role: 'assistant' as const,
      content: 'Test',
      created_at: '2024-01-01T12:00:00',
    };
    
    const { container } = render(<MessageBubble message={message} />);
    const bubble = container.querySelector('.bg-\\[\\#1C1C1C\\]');
    expect(bubble).toBeInTheDocument();
  });
});
