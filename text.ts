import type { ToolOptions } from './types';

/** Split text into lines. Empty text is zero lines, not one empty line. */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  return text.split(/\r?\n/);
}

export function joinLines(lines: string[]): string {
  return lines.join('\n');
}

export function boolOpt(
  options: ToolOptions,
  key: string,
  fallback = false,
): boolean {
  const value = options[key];
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function strOpt(
  options: ToolOptions,
  key: string,
  fallback = '',
): string {
  const value = options[key];
  return typeof value === 'string' && value !== '' ? value : fallback;
}

export function isBlank(line: string): boolean {
  return line.trim() === '';
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export { plural };
