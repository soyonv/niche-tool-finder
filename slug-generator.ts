import type { ToolDefinition } from '../types';
import { joinLines, plural, splitLines, strOpt } from '../text';

export const slugGeneratorTool: ToolDefinition = {
  slug: 'slug-generator',
  title: 'Slug Generator',
  category: 'cleaning',
  tagline:
    'Turn titles, phrases or a whole list of keywords into clean URL slugs.',
  intro: [
    'URL slugs need to be lowercase, ASCII-friendly and punctuation-free — and nobody wants to do that by hand for forty blog titles. Paste one line per title and this tool produces one slug per line: accents are transliterated, punctuation collapsed, spacing normalised to your chosen separator.',
    'Slugs are generated locally; your titles and keywords never leave the browser.',
  ],
  howTo: [
    'Paste the titles, phrases or keywords — one per line for bulk work.',
    'Choose the separator: hyphen (default) or underscore.',
    'Decide whether accented characters should be transliterated (café → cafe).',
    'Copy the column of slugs — order matches your input line for line.',
  ],
  optionsDoc: [
    {
      name: 'Separator',
      description:
        'The character placed between words. Hyphens are the default and the style Google displays in results; underscores suit file names or Python-style identifiers.',
    },
    {
      name: 'Transliterate accented characters',
      description:
        'Strips diacritics so “Crème Brûlée” becomes “creme-brulee”. Turn it off to keep native scripts intact (Unicode slugs are valid in URLs).',
    },
  ],
  faq: [
    {
      q: 'Does one line produce one slug?',
      a: 'Yes — input and output stay line-aligned, so you can paste a column of titles and copy back a column of slugs.',
    },
    {
      q: 'What happens to emoji and punctuation?',
      a: 'They are removed and their surrounding gaps collapsed, so “🚀 Launch Day!” becomes “launch-day”.',
    },
    {
      q: 'Are my keywords uploaded?',
      a: 'No. Slug generation is pure client-side JavaScript — nothing is sent to a server or stored.',
    },
    {
      q: 'Why are my Chinese/Arabic titles not ASCII?',
      a: 'By default the tool keeps Unicode letters rather than destroying them — Unicode slugs work in modern browsers. For strict ASCII, run the output through Find & Replace to strip non-Latin characters.',
    },
    {
      q: 'Is the output unique?',
      a: 'Slugs are not deduplicated automatically — pair this tool with Remove Duplicate Lines if you need unique slugs.',
    },
  ],
  related: ['case-converter', 'remove-duplicate-lines', 'find-and-replace', 'remove-extra-spaces', 'sort-lines'],
  options: [
    {
      type: 'select',
      key: 'separator',
      label: 'Separator',
      default: '-',
      choices: [
        { value: '-', label: 'Hyphen  (my-blog-post)' },
        { value: '_', label: 'Underscore  (my_blog_post)' },
      ],
    },
    {
      type: 'checkbox',
      key: 'transliterate',
      label: 'Transliterate accented characters',
      default: true,
    },
  ],
  exampleInput: 'Cómo hacer el pan: una guía!\n10 Tips for Better Sleep',
  exampleOptions: { separator: '-', transliterate: true },
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const separator = strOpt(options, 'separator', '-');
    const transliterate = options.transliterate !== false;
    const lines = splitLines(input);

    const slugs = lines.map((line) => {
      let value = line;
      if (transliterate) {
        value = value.normalize('NFD').replace(/\p{M}/gu, '');
      }
      value = value
        .toLocaleLowerCase('en')
        .replace(/[^\p{L}\p{N}]+/gu, separator)
        .replace(new RegExp(`${escapeRegex(separator)}+`, 'g'), separator)
        .replace(new RegExp(`^${escapeRegex(separator)}|${escapeRegex(separator)}$`, 'g'), '');
      return value;
    });

    return {
      output: joinLines(slugs),
      summary: `Created ${plural(slugs.length, 'slug')}`,
    };
  },
};

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
