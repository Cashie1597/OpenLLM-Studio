export interface StreamingMarkdownParts {
  stableMarkdown: string;
  trailingText: string;
}

export function splitStreamingMarkdown(content: string): StreamingMarkdownParts {
  const normalized = content.replace(/\r\n/g, '\n');
  const lastNewlineIndex = normalized.lastIndexOf('\n');

  if (lastNewlineIndex === -1) {
    return {
      stableMarkdown: '',
      trailingText: normalized,
    };
  }

  const stableSource = normalized.slice(0, lastNewlineIndex + 1);
  const trailingText = normalized.slice(lastNewlineIndex + 1);

  return {
    stableMarkdown: buildProgressiveMarkdown(stableSource),
    trailingText,
  };
}

function buildProgressiveMarkdown(content: string): string {
  const lines = content.split('\n');
  const renderedLines: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      renderedLines.push(line);
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      renderedLines.push(line);
      continue;
    }

    if (trimmed.length === 0) {
      renderedLines.push('');
      continue;
    }

    if (isBlockMarkdownLine(trimmed)) {
      renderedLines.push(line);
      continue;
    }

    renderedLines.push(`${line}  `);
  }

  let result = renderedLines.join('\n');

  const inlineTicks = countUnescapedBackticks(result) - countTripleFenceTicks(result);
  if (inlineTicks > 0 && inlineTicks % 2 === 1) {
    result += '`';
  }

  if (inFence) {
    result += '\n```';
  }

  return result;
}

function isBlockMarkdownLine(trimmed: string): boolean {
  return /^(#{1,6}\s|\>\s|[-*+]\s|\d+\.\s|\|.*\||(?:-{3,}|\*{3,}|_{3,}))$/.test(trimmed);
}

function countUnescapedBackticks(content: string): number {
  let count = 0;

  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '`' && content[i - 1] !== '\\') {
      count += 1;
    }
  }

  return count;
}

function countTripleFenceTicks(content: string): number {
  const matches = content.match(/```/g);
  return matches ? matches.length * 3 : 0;
}
