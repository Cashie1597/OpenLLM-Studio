export interface StreamingMarkdownParts {
  stableMarkdown: string;
  trailingText: string;
}

/**
 * Prepares streaming markdown for rendering mid-generation.
 * Passes content through as-is (the model outputs valid markdown),
 * but closes any open syntax so the parser doesn't break on partial tokens.
 */
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
    stableMarkdown: closeOpenSyntax(ensureProgressiveLineBreaks(stableSource)),
    trailingText,
  };
}

function ensureProgressiveLineBreaks(content: string): string {
  const lines = content.split('\n');
  let inFence = false;

  return lines
    .map((line, index) => {
      const isLastLine = index === lines.length - 1;
      const trimmed = line.trimStart();

      if (trimmed.startsWith('```')) {
        inFence = !inFence;
        return line;
      }

      if (isLastLine) {
        return line;
      }

      if (inFence || line === '' || isMarkdownBlockLine(line)) {
        return line;
      }

      if (/[ \t]{2}$/.test(line)) {
        return line;
      }

      return `${line}  `;
    })
    .join('\n');
}

function isMarkdownBlockLine(line: string): boolean {
  const trimmed = line.trimStart();

  if (trimmed === '') {
    return true;
  }

  return /^(#{1,6}\s|[-*_]{3,}\s*$|>\s|(?:[-+*]|\d+[.)])\s|```|~~~|\|.*\||\s*\[[ xX]\]\s)/.test(trimmed);
}

function closeOpenSyntax(content: string): string {
  let result = content;

  // Detect open fence by counting fence-opening lines vs fence-closing lines.
  // A line that starts with ``` is a fence marker. Odd count = still open.
  const fenceLines = result.split('\n').filter(l => l.trim().startsWith('```'));
  const inFence = fenceLines.length % 2 === 1;

  // If we're inside a fence, close it so the parser renders what's there
  if (inFence) {
    result += '\n```';
    return result; // Don't mess with inline markers inside a code block
  }

  // Close open inline backtick (single `)
  // Count single backticks that are NOT part of triple backticks
  const withoutFences = result.replace(/```[\s\S]*?```/g, '').replace(/```/g, '');
  const singleTicks = (withoutFences.match(/(?<!\\)`/g) ?? []).length;
  if (singleTicks % 2 === 1) result += '`';

  // Close open bold **
  const boldCount = (result.match(/\*\*/g) ?? []).length;
  if (boldCount % 2 === 1) result += '**';

  // Close open italic * (excluding ** pairs)
  const withoutBold = result.replace(/\*\*/g, '');
  const italicCount = (withoutBold.match(/\*/g) ?? []).length;
  if (italicCount % 2 === 1) result += '*';

  return result;
}
