import type { ToolDefinition } from '../types';
import { boolOpt, isBlank, joinLines, plural, splitLines, strOpt } from '../text';

export const removeDuplicateLinesTool: ToolDefinition = {
  slug: 'remove-duplicate-lines',
  title: 'Remove Duplicate Lines',
  category: 'cleaning',
  tagline: 'Delete repeated lines from any list, keeping the first or last copy.',
  intro: [
    'Pasted lists accumulate duplicates: emails copied twice, keywords exported from three tools, log lines repeated every retry. This tool removes duplicate lines instantly, with controls for case, spacing and punctuation so “Apple” and “apple ” can be treated as the same line or as different ones.',
    'Everything runs in your browser. The text you paste is never uploaded, stored or logged — close the tab and it is gone.',
  ],
  howTo: [
    'Paste or type your list into the input box (one item per line).',
    'Choose how lines should be compared: case-sensitive, trimmed of surrounding spaces, punctuation-blind, and whether blank lines should be left alone.',
    'Pick which copy to keep — the first occurrence or the last one.',
    'Review the live output and the “removed” count, then press Copy or Download.',
  ],
  optionsDoc: [
    {
      name: 'Case-sensitive comparison',
      description:
        'When off (default), “Apple” and “apple” count as duplicates. Turn it on to keep lines that differ only by capitalisation.',
    },
    {
      name: 'Ignore surrounding spaces',
      description:
        'When on (default), “hello” and “  hello  ” are treated as the same line. Lines are compared after trimming, but your original text is kept intact.',
    },
    {
      name: 'Ignore punctuation',
      description:
        'Compares lines without punctuation, so “cat.” and “cat” collapse into one. Useful for sentence lists and scraped titles.',
    },
    {
      name: 'Keep blank lines untouched',
      description:
        'When on (default), empty lines are passed through instead of being deduplicated, so gaps between sections survive. Run the Remove Blank Lines tool afterwards if you want them gone entirely.',
    },
    {
      name: 'Keep',
      description:
        'First keeps the earliest copy of each line, Last keeps the most recent one — handy when a later entry has fresher data.',
    },
  ],
  faq: [
    {
      q: 'Does my text get uploaded anywhere?',
      a: 'No. All processing happens inside your browser with local JavaScript. Nothing you paste is sent to a server, and there is no account, log or database holding it.',
    },
    {
      q: 'Is there a limit on how many lines I can clean?',
      a: 'No artificial limit. Small lists are processed instantly on the main thread; very large inputs (over about 100 KB) are handed to a Web Worker so your page stays responsive while the work happens in the background tab.',
    },
    {
      q: 'Does it remove duplicate words inside one line?',
      a: 'No — this tool works line by line. If you need to deduplicate words or sentences inside a single line, split them onto separate lines first (the Find & Replace tool can convert commas into line breaks).',
    },
    {
      q: 'Are “Apple” and “apple” duplicates?',
      a: 'By default yes, because case-sensitive comparison is off. Enable the case-sensitive option if capitalisation matters to you — for example when brand names differ only by case.',
    },
    {
      q: 'What happens to blank lines?',
      a: 'With the default settings blank lines are left untouched, so your list keeps its visual grouping. Enable Remove Blank Lines in the options if you want them stripped too.',
    },
    {
      q: 'Can I undo the cleaning?',
      a: 'Yes — the tool never modifies your input, it only produces an output. Your original text stays exactly where it is, and Undo restores the input after Clear or Try example.',
    },
  ],
  related: [
    'sort-lines',
    'remove-blank-lines',
    'case-converter',
    'remove-extra-spaces',
    'text-diff',
  ],
  options: [
    {
      type: 'checkbox',
      key: 'caseSensitive',
      label: 'Case-sensitive comparison',
      default: false,
    },
    {
      type: 'checkbox',
      key: 'trimLines',
      label: 'Ignore surrounding spaces',
      default: true,
    },
    {
      type: 'checkbox',
      key: 'ignorePunctuation',
      label: 'Ignore punctuation',
      default: false,
    },
    {
      type: 'checkbox',
      key: 'keepBlanks',
      label: 'Keep blank lines untouched',
      default: true,
    },
    {
      type: 'select',
      key: 'keep',
      label: 'Duplicate copy to keep',
      default: 'first',
      choices: [
        { value: 'first', label: 'First occurrence' },
        { value: 'last', label: 'Last occurrence' },
      ],
    },
  ],
  exampleInput: 'ada@example.com\ngrace@example.com\nada@example.com\n  ada@example.com  \nlinus@example.com\nGRACE@example.com',
  exampleOptions: { caseSensitive: false, trimLines: true },
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const lines = splitLines(input);
    const caseSensitive = boolOpt(options, 'caseSensitive', false);
    const trim = boolOpt(options, 'trimLines', true);
    const ignorePunctuation = boolOpt(options, 'ignorePunctuation', false);
    const keepBlanks = boolOpt(options, 'keepBlanks', true);
    const keep = strOpt(options, 'keep', 'first');

    const keyOf = (line: string): string => {
      let key = trim ? line.trim() : line;
      if (!caseSensitive) key = key.toLowerCase();
      if (ignorePunctuation) {
        key = key
          .replace(/[^\p{L}\p{N}\s]/gu, ' ')
          .replace(/\s+/gu, ' ')
          .trim()
          .toLowerCase();
      }
      return key;
    };

    const keepIndexes = new Set<number>();
    const lastIndexByKey = new Map<string, number>();
    const firstSeen = new Set<string>();

    lines.forEach((line, index) => {
      if (keepBlanks && isBlank(line)) {
        keepIndexes.add(index);
        return;
      }
      const key = keyOf(line);
      if (keep === 'last') {
        lastIndexByKey.set(key, index);
      } else if (!firstSeen.has(key)) {
        firstSeen.add(key);
        keepIndexes.add(index);
      }
    });
    if (keep === 'last') {
      for (const index of lastIndexByKey.values()) keepIndexes.add(index);
    }

    const output = joinLines(lines.filter((_, index) => keepIndexes.has(index)));
    const removed = lines.length - splitLines(output).length;
    return {
      output,
      summary:
        removed === 0
          ? 'No duplicate lines found'
          : `Removed ${plural(removed, 'duplicate line')}`,
    };
  },
};
