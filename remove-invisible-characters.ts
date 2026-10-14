import type { ToolDefinition } from '../types';
import { boolOpt } from '../text';

type Group = 'zerowidth' | 'nbsp' | 'directional' | 'soft';

const CATALOG: { char: string; name: string; group: Group }[] = [
  { char: '\u200B', name: 'ZERO WIDTH SPACE', group: 'zerowidth' },
  { char: '\u200C', name: 'ZERO WIDTH NON-JOINER', group: 'zerowidth' },
  { char: '\u200D', name: 'ZERO WIDTH JOINER', group: 'zerowidth' },
  { char: '\u2060', name: 'WORD JOINER', group: 'zerowidth' },
  { char: '\uFEFF', name: 'BOM / ZERO WIDTH NO-BREAK SPACE', group: 'zerowidth' },
  { char: '\u034F', name: 'COMBINING GRAPHEME JOINER', group: 'zerowidth' },
  { char: '\u00A0', name: 'NON-BREAKING SPACE', group: 'nbsp' },
  { char: '\u202A', name: 'LEFT-TO-RIGHT EMBEDDING', group: 'directional' },
  { char: '\u202B', name: 'RIGHT-TO-LEFT EMBEDDING', group: 'directional' },
  { char: '\u202C', name: 'POP DIRECTIONAL FORMATTING', group: 'directional' },
  { char: '\u202D', name: 'LEFT-TO-RIGHT OVERRIDE', group: 'directional' },
  { char: '\u202E', name: 'RIGHT-TO-LEFT OVERRIDE', group: 'directional' },
  { char: '\u2066', name: 'LEFT-TO-RIGHT ISOLATE', group: 'directional' },
  { char: '\u2067', name: 'RIGHT-TO-LEFT ISOLATE', group: 'directional' },
  { char: '\u2068', name: 'FIRST STRONG ISOLATE', group: 'directional' },
  { char: '\u2069', name: 'POP DIRECTIONAL ISOLATE', group: 'directional' },
  { char: '\u00AD', name: 'SOFT HYPHEN', group: 'soft' },
];

export const removeInvisibleCharactersTool: ToolDefinition = {
  slug: 'remove-invisible-characters',
  title: 'Remove Invisible Characters',
  category: 'unicode',
  tagline:
    'Find and delete hidden Unicode characters — zero-width, BOM, non-breaking and directional marks.',
  intro: [
    'You paste a name, an email or a product title, and it silently fails to match anything. The usual culprit is an invisible character: a zero-width space from a PDF, a non-breaking space from a web page, or a hidden directional override that even reverses your text. They cannot be seen, so they survive every manual cleanup.',
    'This tool detects the whole family of invisible Unicode characters, removes them (or converts non-breaking spaces to normal spaces), and tells you exactly which ones it found and how many.',
    'Detection and cleaning run locally — nothing is uploaded.',
  ],
  howTo: [
    'Paste the text that refuses to match, copy or import correctly.',
    'Choose which groups to clean: zero-width characters, non-breaking spaces, directional formatting marks, soft hyphens.',
    'Read the result line: it lists each removed character name and its count, so you know what went wrong.',
    'Copy the cleaned text and retry your import, search or merge.',
  ],
  optionsDoc: [
    {
      name: 'Remove zero-width characters',
      description:
        'Zero-width space, non-joiner, joiner, word joiner, BOM and combining grapheme joiner — characters that take up no space but break equality checks.',
    },
    {
      name: 'Replace non-breaking spaces with normal spaces',
      description:
        'U+00A0 looks identical to a regular space but compares unequal. It is replaced with a standard space rather than deleted, so words do not fuse together.',
    },
    {
      name: 'Remove directional formatting characters',
      description:
        'Hidden LTR/RTL overrides and isolates — including the characters used in “Trojan Source” style spoofing and reversed filenames.',
    },
    {
      name: 'Remove soft hyphens',
      description:
        'U+00AD is an invisible hyphen inserted by word processors; it silently splits search terms.',
    },
  ],
  faq: [
    {
      q: 'How do I know my text has invisible characters?',
      a: 'The result line names every character it removed with a count — for example “ZERO WIDTH SPACE ×9”. If the count is zero, your problem is elsewhere.',
    },
    {
      q: 'Why does my CSV import fail on one row?',
      a: 'A hidden character changes the string, so the row no longer matches your keys or schema. Paste the failing row here to see it named.',
    },
    {
      q: 'Are these the same as emoji or formatting?',
      a: 'No — this tool only targets invisible control and formatting characters. Visible emoji, letters and punctuation are untouched.',
    },
    {
      q: 'Does removing them change how my text displays?',
      a: 'Almost never. Zero-width characters are invisible by definition. The one visible exception is soft hyphenation, which currently only shows when a line breaks at that point.',
    },
    {
      q: 'Is my text uploaded for analysis?',
      a: 'No. Detection runs entirely in your browser with local JavaScript; no server sees your data.',
    },
  ],
  related: ['remove-extra-spaces', 'find-and-replace', 'remove-blank-lines', 'remove-duplicate-lines', 'extract-emails-urls'],
  options: [
    { type: 'checkbox', key: 'zeroWidth', label: 'Remove zero-width characters', default: true },
    { type: 'checkbox', key: 'nbsp', label: 'Replace non-breaking spaces with normal spaces', default: true },
    { type: 'checkbox', key: 'directional', label: 'Remove directional formatting characters', default: true },
    { type: 'checkbox', key: 'softHyphen', label: 'Remove soft hyphens', default: false },
  ],
  exampleInput: 'hello\u200Bworld\nold\u00A0style\u00A0spacing\nsafe\u202Etxt',
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const enabled: Record<Group, boolean> = {
      zerowidth: boolOpt(options, 'zeroWidth', true),
      nbsp: boolOpt(options, 'nbsp', true),
      directional: boolOpt(options, 'directional', true),
      soft: boolOpt(options, 'softHyphen', false),
    };

    let output = input;
    const findings: string[] = [];
    let total = 0;

    for (const entry of CATALOG) {
      if (!enabled[entry.group]) continue;
      if (!output.includes(entry.char)) continue;
      let count = 0;
      for (let i = 0; i < output.length; i++) {
        if (output[i] === entry.char) count += 1;
      }
      total += count;
      findings.push(`${entry.name} ×${count}`);
      output = output.split(entry.char).join(entry.group === 'nbsp' ? ' ' : '');
    }

    return {
      output,
      summary:
        total === 0
          ? 'No invisible characters found'
          : entryWord(total),
      detail: findings.join(' · '),
    };
  },
};

function entryWord(total: number): string {
  const noun =
    total === 1
      ? 'invisible character'
      : 'invisible characters';
  const verb = 'Removed';
  return `${verb} ${total} ${noun}`;
}
