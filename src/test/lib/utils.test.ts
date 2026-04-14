import { describe, it, expect } from 'vitest';
import { formatBytes, cn } from '../../lib/utils';

describe('utils', () => {
  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(3825819519)).toBe('3.6 GB');
    });

    it('handles decimals', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
    });
  });

  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });

    it('handles undefined and null', () => {
      expect(cn('base', undefined, null)).toBe('base');
    });
  });
});
