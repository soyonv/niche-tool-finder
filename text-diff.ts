import type { ToolDefinition } from '../types';
import { boolOpt, splitLines } from '../text';

interface DiffOp {
  type: 'same' | 'del' | 'add';
  text: string;
}

function normalizeKey(line: string, ignoreCase: boolean, ignoreWhitespace: boolean): string {
  let key = line;
  if (ignoreWhitespace) key = key.trim().replace(/\s+/g, ' ');
  if (ignoreCase) key = key.toLocaleLowerCase('en');
  return key;
}

function diffLines(a: string[], b: string[], keyA: string[], keyB: string[]): DiffOp[] {
  // Trim common prefix and suffix to keep the LCS table small.
  let start = 0;
  while (start < a.length && start < b.length && keyA[start] === keyB[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && keyA[endA - 1] === keyB[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const ops: DiffOp[] = [];

  for (let i = 0; i < start; i++) ops.push({ type: 'same', text: a[i] });

  if (midA.length * midB.length > 4_000_000) {
    // Too large for an LCS table: treat the middle block as replaced.
    for (const line of midA) ops.push({ type: 'del', text: line });
    for (const line of midB) ops.push({ type: 'add', text: line });
  } else if (midA.length === 0) {
    for (const line of midB) ops.push({ type: 'add', text: line });
  } else if (midB.length === 0) {
    for (const line of midA) ops.push({ type: 'del', text: line });
  } else {
    const n = midA.length;
    const m = midB.length;
    // table[i][j] = LCS length of midA[i..] vs midB[j..]
    const table: number[][] = Array.from({ length: n + 1 }, () =>
      new Array<number>(m + 1).fill(0),
    );
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i][j] =
          keyA[start + i] === keyB[start + j]
            ? table[i + 1][j + 1] + 1
            : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (keyA[start + i] === keyB[start + j]) {
        ops.push({ type: 'same', text: a[start + i] });
        i++;
        j++;
      } else if (table[i + 1][j] >= table[i][j + 1]) {
        ops.push({ type: 'del', text: a[start + i] });
        i++;
      } else {
        ops.push({ type: 'add', text: b[start + j] });
        j++;
      }
    }
    while (i < n) {
      ops.push({ type: 'del', text: a[start + i] });
      i++;
    }
    while (j < m) {
      ops.push({ type: 'add', text: b[start + j] });
      j++;
    }
  }

  for (let k = endA; k < a.length; k++) ops.push({ type: 'same', text: a[k] });
  return ops;
}

export const textDiffTool: ToolDefinition = {
  slug: 'text-diff',
  title: 'Text Diff',
  category: 'diff',
  tagline: 'Compare two versions of a text and see exactly what changed.',
  dual: true,
  secondInputLabel: 'Paste the second version (right side)',
  intro: [
    'Two versions of the same paragraph, a changelog against a draft, an old keyword list against a new export — comparing them by eye wastes time and misses things. Paste both sides and this tool produces a line-by-line diff: unchanged lines stay plain, removed lines are prefixed with “-”, added lines with “+”.',
    'Comparison happens entirely in your browser. Neither version is uploaded, so confidential drafts stay confidential.',
  ],
  howTo: [
    'Paste the original text on the left and the revised text on the right.',
    'Optionally ignore whitespace-only or case-only differences to cut the noise.',
    'Read the diff: “-” lines were removed, “+” lines were added, plain lines are unchanged.',
    'Copy the diff with its markers, or copy either side back out.',
  ],
  optionsDoc: [
    {
      name: 'Ignore whitespace changes',
      description:
        'Lines that differ only in spacing or indentation count as unchanged.',
    },
    {
      name: 'Ignore case differences',
      description:
        'Lines that differ only by capitalisation count as unchanged.',
    },
  ],
  faq: [
    {
      q: 'How large a document can it compare?',
      a: 'Line counts in the thousands are fine. Very large middle sections (millions of line pairs) fall back to a fast block-replacement view rather than freezing the tab.',
    },
    {
      q: 'Is the output a real diff format?',
      a: 'It is a simple line diff with - and + prefixes — readable by humans and easy to paste anywhere. Standard unified-diff headers are not included.',
    },
    {
      q: 'Does it compare character by character within a line?',
      a: 'No — this is a line diff. For single-line edits, put each variant on its own line and let the tool match them.',
    },
    {
      q: 'Are my documents uploaded?',
      a: 'No. The comparison runs locally in your browser, including inside a Web Worker for large inputs.',
    },
  ],
  related: ['remove-duplicate-lines', 'find-and-replace', 'remove-extra-spaces', 'remove-invisible-characters', 'case-converter'],
  options: [
    { type: 'checkbox', key: 'ignoreWhitespace', label: 'Ignore whitespace changes', default: false },
    { type: 'checkbox', key: 'ignoreCase', label: 'Ignore case differences', default: false },
  ],
  exampleInput: 'line one\nline two\nline three',
  exampleInput2: 'line one\nline 2\nline three\nline four',
  run(input, options, input2) {
    if (input === '' && (input2 ?? '') === '') {
      return { output: '', summary: 'Paste both texts to compare' };
    }
    const ignoreCase = boolOpt(options, 'ignoreCase', false);
    const ignoreWhitespace = boolOpt(options, 'ignoreWhitespace', false);

    const a = splitLines(input);
    const b = splitLines(input2 ?? '');
    const keyA = a.map((line) => normalizeKey(line, ignoreCase, ignoreWhitespace));
    const keyB = b.map((line) => normalizeKey(line, ignoreCase, ignoreWhitespace));

    const ops = diffLines(a, b, keyA, keyB);
    const added = ops.filter((op) => op.type === 'add').length;
    const removed = ops.filter((op) => op.type === 'del').length;
    const output = ops
      .map((op) => (op.type === 'same' ? op.text : `${op.type === 'add' ? '+ ' : '- '}${op.text}`))
      .join('\n');

    if (added === 0 && removed === 0) {
      return { output, summary: 'No differences found' };
    }
    return {
      output,
      summary: `${added} added · ${removed} removed`,
    };
  },
};
