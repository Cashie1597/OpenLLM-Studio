import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelCard } from '../../components/ModelCard';

describe('ModelCard', () => {
  const mockModel = {
    name: 'llama2:7b',
    displayName: 'Llama 2 7B',
    description: 'Meta Llama 2 7B model',
    size: '3.8 GB',
    parameters: '7B',
  };

  it('renders model name', () => {
    render(<ModelCard model={mockModel} isInstalled={false} onDownload={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Llama 2 7B')).toBeInTheDocument();
  });

  it('displays model size', () => {
    render(<ModelCard model={mockModel} isInstalled={false} onDownload={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('3.8 GB')).toBeInTheDocument();
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    render(<ModelCard model={mockModel} isInstalled={false} onDownload={onDownload} onDelete={vi.fn()} />);
    
    const downloadButton = screen.getByText(/download/i);
    fireEvent.click(downloadButton);
    
    expect(onDownload).toHaveBeenCalledWith('llama2:7b');
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<ModelCard model={mockModel} isInstalled={true} onDownload={vi.fn()} onDelete={onDelete} />);
    
    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith('llama2:7b');
  });

  it('shows installed badge when model is installed', () => {
    render(<ModelCard model={mockModel} isInstalled={true} onDownload={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Installed')).toBeInTheDocument();
  });
});
