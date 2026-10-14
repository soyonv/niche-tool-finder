import type { ToolDefinition } from '../types';
import { boolOpt, joinLines, plural, splitLines } from '../text';

export const removeBlankLinesTool: ToolDefinition = {
  slug: 'remove-blank-lines',
  title: 'Remove Blank Lines',
  category: 'whitespace',
  tagline: 'Strip empty lines from text, lists and pasted code.',
  intro: [
    'Blank lines sneak in from spreadsheets, email threads and scraped pages. They break line-by-line imports, inflate CSV rows and make lists look untidy. This tool deletes empty lines in one pass, optionally counting lines that hold only spaces or tabs as empty too.',
    'The paste stays in your browser: no upload, no queue, no server sees your data.',
  ],
  howTo: [
    'Paste the text that contains unwanted blank lines.',
    'Leave “treat whitespace-only lines as blank” on unless you want to keep lines that contain only spaces or tabs.',
    'Watch the counter update live as blank lines disappear.',
    'Copy or download the cleaned result.',
  ],
  optionsDoc: [
    {
      name: 'Treat whitespace-only lines as blank',
      description:
        'When on (default), a line containing only spaces or tabs counts as blank and is removed. Turn it off to delete strictly empty lines only.',
    },
  ],
  faq: [
    {
      q: 'Does this upload my text?',
      a: 'No. The transformation runs as JavaScript inside your tab. Nothing is transmitted or stored on any server.',
    },
    {
      q: 'Can it collapse multiple blank lines instead of removing them all?',
      a: 'Not in this tool — it removes blank lines entirely. If you only want to shrink runs of blank lines to one, run Find & Replace with regex mode to replace three or more newlines with two.',
    },
    {
      q: 'Will it change my line endings?',
      a: 'The output uses standard newlines. Windows-style CRLF endings in the input are normalised to simple line breaks, which is what most importers expect.',
    },
    {
      q: 'Does it touch indentation inside my lines?',
      a: 'No. Leading spaces and tabs inside non-blank lines are left exactly as they are — pair it with Remove Extra Spaces if you also want to trim them.',
    },
  ],
  related: ['remove-duplicate-lines', 'remove-extra-spaces', 'sort-lines', 'find-and-replace', 'remove-invisible-characters'],
  options: [
    {
      type: 'checkbox',
      key: 'whitespaceOnly',
      label: 'Treat whitespace-only lines as blank',
      default: true,
    },
  ],
  exampleInput: 'first row\n\nsecond row\n   \nthird row\n\n\nfourth row',
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const whitespaceOnly = boolOpt(options, 'whitespaceOnly', true);
    const lines = splitLines(input);
    const kept = lines.filter((line) =>
      whitespaceOnly ? line.trim() !== '' : line !== '',
    );
    const removed = lines.length - kept.length;
    return {
      output: joinLines(kept),
      summary:
        removed === 0
          ? 'No blank lines found'
          : `Removed ${plural(removed, 'blank line')}`,
    };
  },
};
