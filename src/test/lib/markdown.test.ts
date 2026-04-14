import { describe, expect, it } from 'vitest';
import { splitStreamingMarkdown } from '../../lib/markdown';

describe('splitStreamingMarkdown', () => {
  it('keeps the unfinished current line out of markdown rendering', () => {
    const input = '## Title\nThis is still typing';
    expect(splitStreamingMarkdown(input)).toEqual({
      stableMarkdown: '## Title\n',
      trailingText: 'This is still typing',
    });
  });

  it('closes an unfinished fenced code block inside the stable section', () => {
    const input = '```ts\nconst x = 1;\nconst y = 2;\npartial';
    expect(splitStreamingMarkdown(input)).toEqual({
      stableMarkdown: '```ts\nconst x = 1;\nconst y = 2;\n\n```',
      trailingText: 'partial',
    });
  });

  it('forces completed plain-text lines to render progressively', () => {
    const input = 'First line\nSecond line\nstill typing';
    expect(splitStreamingMarkdown(input)).toEqual({
      stableMarkdown: 'First line  \nSecond line  \n',
      trailingText: 'still typing',
    });
  });

  it('preserves list formatting for completed markdown lines', () => {
    const input = '- item one\n- item two\nnext';
    expect(splitStreamingMarkdown(input)).toEqual({
      stableMarkdown: '- item one\n- item two\n',
      trailingText: 'next',
    });
  });

  it('returns all text as trailing when no newline has arrived yet', () => {
    const input = 'typing without newline';
    expect(splitStreamingMarkdown(input)).toEqual({
      stableMarkdown: '',
      trailingText: 'typing without newline',
    });
  });
});
