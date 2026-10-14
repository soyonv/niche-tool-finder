import type { ToolDefinition } from '../types';
import { boolOpt, plural, strOpt } from '../text';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const findAndReplaceTool: ToolDefinition = {
  slug: 'find-and-replace',
  title: 'Find and Replace',
  category: 'cleaning',
  tagline:
    'Replace text across a whole document — with optional regular expressions.',
  intro: [
    'Find & Replace is the workhorse of text cleaning: swap a domain across thousands of emails, turn commas into line breaks, strip tracking parameters, or run a regular expression when plain search is not enough. The match counter updates live so you can see the blast radius before copying anything.',
    'Your document never leaves the browser — replacements are computed locally, and invalid regular expressions fail safely without touching your text.',
  ],
  howTo: [
    'Paste the text you want to edit.',
    'Type what to find and what to replace it with.',
    'Enable regular-expression mode if your search pattern uses regex syntax; leave case-sensitive off unless capitalisation matters.',
    'Check the match count, then copy the result.',
  ],
  optionsDoc: [
    {
      name: 'Regular expression mode',
      description:
        'Treats the Find field as a regex pattern, including groups and anchors. If the pattern is invalid the original text is returned unchanged and the error is shown in plain English.',
    },
    {
      name: 'Case-sensitive',
      description:
        'When off (default), “cat” matches “Cat” and “CAT”.',
    },
  ],
  faq: [
    {
      q: 'Does this upload my document?',
      a: 'No — search and replacement run locally in your browser. Nothing is transmitted.',
    },
    {
      q: 'What regex flavour does it use?',
      a: 'Standard JavaScript regular expressions, the same syntax used everywhere in modern browsers, including lookbehind.',
    },
    {
      q: 'Can I replace across line breaks?',
      a: 'Yes with regex mode: type \\n in the Find field to match newlines, and \\n in the Replace field to insert them.',
    },
    {
      q: 'Why does nothing happen when my regex fails?',
      a: 'A broken pattern returns your original text plus a readable error in the status line instead of wiping or half-editing your input.',
    },
    {
      q: 'Is there a match limit?',
      a: 'No artificial limit. Very large inputs switch processing to a background Web Worker so the page keeps responding while replacements run.',
    },
  ],
  related: ['remove-extra-spaces', 'case-converter', 'remove-duplicate-lines', 'remove-invisible-characters', 'extract-emails-urls'],
  options: [
    { type: 'text', key: 'find', label: 'Find', default: '', placeholder: 'e.g. , or https://old-site.com' },
    { type: 'text', key: 'replace', label: 'Replace with', default: '', placeholder: 'e.g. \\n (new line)' },
    {
      type: 'checkbox',
      key: 'regex',
      label: 'Regular expression mode',
      default: false,
    },
    {
      type: 'checkbox',
      key: 'caseSensitive',
      label: 'Case-sensitive',
      default: false,
    },
  ],
  exampleInput: 'alice@example.com, bob@example.com, carol@example.com',
  exampleOptions: { find: ', ', replace: '\\n', regex: false },
  run(input, options) {
    const find = strOpt(options, 'find', '');
    if (input === '') return { output: '', summary: 'Nothing to process' };
    if (find === '') {
      return { output: input, summary: 'Enter text to find' };
    }
    const rawReplace = typeof options.replace === 'string' ? options.replace : '';
    // Let people type \n and \t to mean a real newline/tab in the output.
    const replace = rawReplace.replace(/\\([ntr])/g, (_, char: string) =>
      char === 'n' ? '\n' : char === 't' ? '\t' : '\r',
    );
    const useRegex = boolOpt(options, 'regex', false);
    const caseSensitive = boolOpt(options, 'caseSensitive', false);
    const flags = `g${caseSensitive ? '' : 'i'}`;
    const pattern = useRegex ? find : escapeRegExp(find);

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        output: input,
        summary: 'Invalid regular expression — text left unchanged',
        detail: message,
      };
    }

    let count = 0;
    const output = input.replace(regex, () => {
      count += 1;
      return replace;
    });
    return {
      output,
      summary:
        count === 0
          ? 'No matches found'
          : `Made ${plural(count, 'replacement')}`,
    };
  },
};
