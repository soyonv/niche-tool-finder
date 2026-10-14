import type { ToolDefinition } from '../types';
import { boolOpt, isBlank, joinLines, plural, splitLines, strOpt } from '../text';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function firstNumber(line: string): number | null {
  const match = line.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0].replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sortLinesTool: ToolDefinition = {
  slug: 'sort-lines',
  title: 'Sort Lines',
  category: 'sorting',
  tagline: 'Sort any list A–Z, Z–A, by number, by length — or shuffle it.',
  intro: [
    'Unsorted lists hide duplicates and make comparison impossible. Sort lines alphabetically, naturally (so item2 comes before item10), numerically, by length, or reverse and shuffle the order entirely — all in one keystroke, right in your browser.',
    'Nothing is uploaded. The list you paste never leaves the device it was pasted on.',
  ],
  howTo: [
    'Paste the list you want to order.',
    'Pick a sort mode: A→Z, Z→A, natural order, numeric, by length, reverse or shuffle.',
    'Choose whether blank lines should sink to the bottom of the result.',
    'Copy the sorted list when the order looks right.',
  ],
  optionsDoc: [
    {
      name: 'Sort mode',
      description:
        'Alphabetical modes ignore case and accents. Natural order understands embedded numbers (line2 before line10). Numeric sorts by the first number found in each line. Length sorts shortest first. Shuffle uses a stable seed, so the same text always shuffles the same way.',
    },
    {
      name: 'Trim lines before sorting',
      description:
        'Ignores leading and trailing spaces when ordering, so “  apple” does not sort before “banana” by accident.',
    },
    {
      name: 'Keep blank lines at the bottom',
      description:
        'On by default: empty lines are gathered to the end instead of floating to the top of an A→Z sort.',
    },
  ],
  faq: [
    {
      q: 'Is my list uploaded to be sorted?',
      a: 'No. Sorting happens locally in JavaScript — no server, no account, no storage.',
    },
    {
      q: 'Why does item10 appear before item2 in a normal sort?',
      a: 'Plain alphabetical sorting treats numbers as text. Use the Natural (A→Z, numbers aware) mode and item2 will come first.',
    },
    {
      q: 'Is the shuffle really random?',
      a: 'It is seeded from your text, so the same input always produces the same order — which keeps results reproducible while you edit. Change the text and you get a new order.',
    },
    {
      q: 'Can it sort by a specific column (e.g. CSV)?',
      a: 'Not yet — this tool sorts whole lines. Column-aware sorting for pasted tables is on the roadmap for the CSV wave.',
    },
  ],
  related: ['remove-duplicate-lines', 'remove-blank-lines', 'case-converter', 'extract-emails-urls', 'text-diff'],
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Sort mode',
      default: 'asc',
      choices: [
        { value: 'asc', label: 'A → Z (alphabetical)' },
        { value: 'desc', label: 'Z → A (reverse alphabetical)' },
        { value: 'natural', label: 'Natural order (item2 before item10)' },
        { value: 'numeric', label: 'Numeric (by first number)' },
        { value: 'length', label: 'By length (short → long)' },
        { value: 'reverse', label: 'Reverse current order' },
        { value: 'shuffle', label: 'Shuffle randomly' },
      ],
    },
    {
      type: 'checkbox',
      key: 'trimLines',
      label: 'Trim lines before sorting',
      default: false,
    },
    {
      type: 'checkbox',
      key: 'blanksLast',
      label: 'Keep blank lines at the bottom',
      default: true,
    },
  ],
  exampleInput: 'pear\napple 10\nbanana\napple 2\ncherry',
  exampleOptions: { mode: 'natural' },
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const lines = splitLines(input);
    const mode = strOpt(options, 'mode', 'asc');
    const trim = boolOpt(options, 'trimLines', false);
    const blanksLast = boolOpt(options, 'blanksLast', true);

    const decorated = lines.map((line, index) => ({
      line,
      index,
      key: trim ? line.trim() : line,
    }));
    const blanks = blanksLast ? decorated.filter((d) => isBlank(d.line)) : [];
    const rest = blanksLast ? decorated.filter((d) => !isBlank(d.line)) : decorated;

    const compareAlpha = (a: string, b: string) => collator.compare(a, b);
    const sorted = [...rest];
    switch (mode) {
      case 'desc':
        sorted.sort((a, b) => compareAlpha(b.key, a.key) || a.index - b.index);
        break;
      case 'natural':
        sorted.sort((a, b) => compareAlpha(a.key, b.key) || a.index - b.index);
        break;
      case 'numeric':
        sorted.sort((a, b) => {
          const na = firstNumber(a.key);
          const nb = firstNumber(b.key);
          if (na === null && nb === null) return a.index - b.index;
          if (na === null) return 1;
          if (nb === null) return -1;
          return na - nb || a.index - b.index;
        });
        break;
      case 'length':
        sorted.sort(
          (a, b) => a.key.length - b.key.length || compareAlpha(a.key, b.key),
        );
        break;
      case 'reverse':
        sorted.reverse();
        break;
      case 'shuffle': {
        const random = mulberry32(hashString(lines.join('\n')));
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
        break;
      }
      case 'asc':
      default:
        sorted.sort((a, b) => compareAlpha(a.key, b.key) || a.index - b.index);
        break;
    }

    const output = joinLines([...sorted, ...blanks].map((d) => d.line));
    const verb =
      mode === 'shuffle' ? 'Shuffled' : mode === 'reverse' ? 'Reversed' : 'Sorted';
    return {
      output,
      summary: `${verb} ${plural(lines.length, 'line')}`,
    };
  },
};
