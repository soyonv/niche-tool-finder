import type { ToolDefinition } from '../types';
import { joinLines, plural, splitLines, strOpt } from '../text';

const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into',
  'nor', 'of', 'on', 'or', 'over', 'the', 'to', 'via', 'with',
]);

function firstLetterUpper(word: string): string {
  return word.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase('en'));
}

function toTitleCase(line: string, useMinorWords: boolean): string {
  const words = line.split(/(\s+)/);
  const wordPositions = words
    .map((part, i) => ({ part, i }))
    .filter(({ part }) => part.trim() !== '');
  const firstIndex = wordPositions[0]?.i;
  const lastIndex = wordPositions[wordPositions.length - 1]?.i;
  return words
    .map((part, i) => {
      if (part.trim() === '') return part;
      const lower = part.toLocaleLowerCase('en');
      const bare = lower.replace(/^\W+|\W+$/g, '');
      if (
        useMinorWords &&
        i !== firstIndex &&
        i !== lastIndex &&
        MINOR_WORDS.has(bare)
      ) {
        return lower;
      }
      return firstLetterUpper(part);
    })
    .join('');
}

function toSentenceCase(line: string): string {
  const lower = line.toLocaleLowerCase('en');
  return lower.replace(
    /(^\s*\p{L})|([.!?…]\s+\p{L})|(\(\p{L})/gu,
    (match) => match.toLocaleUpperCase('en'),
  );
}

function wordsOf(line: string): string[] {
  return line
    .toLocaleLowerCase('en')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export const caseConverterTool: ToolDefinition = {
  slug: 'case-converter',
  title: 'Case Converter',
  category: 'case',
  tagline:
    'Switch text between UPPERCASE, lowercase, Title Case, camelCase, snake_case and more.',
  intro: [
    'Wrong capitalisation is the fastest way to make a list look sloppy — shouted ALL CAPS names from a legacy database, sentence-cased headlines, variables in the wrong style. This converter handles eight common cases, line by line, so a whole list can be fixed at once rather than retyped.',
    'It runs entirely on your device. Whatever you paste is yours alone: no upload, no account, no retention.',
  ],
  howTo: [
    'Paste the text you want to re-cased — one item per line works best for lists.',
    'Choose the target case: UPPER, lower, Title, Sentence, camelCase, snake_case, kebab-case or CONSTANT_CASE.',
    'For Title Case, decide whether short words like “the” and “of” should stay lowercase.',
    'Copy the converted text; your original stays untouched.',
  ],
  optionsDoc: [
    {
      name: 'Case style',
      description:
        'UPPERCASE and lowercase apply to every character. Title Case capitalises each word (optionally keeping minor words lowercase). Sentence case capitalises sentence starts. camelCase, snake_case, kebab-case and CONSTANT_CASE reshape each line into a code-friendly identifier.',
    },
    {
      name: 'Title Case: lowercase minor words',
      description:
        'Keeps short connector words (a, an, the, of, and…) lowercase unless they start or end the line — the AP/Chicago convention.',
    },
  ],
  faq: [
    {
      q: 'Is my text sent anywhere to be converted?',
      a: 'No. All conversion happens locally in your browser with JavaScript — nothing is uploaded or stored.',
    },
    {
      q: 'Does it work on a whole paragraph or only lists?',
      a: 'Both. Each line is converted independently, so a single paragraph on one line works exactly like a list of 10,000 items.',
    },
    {
      q: 'Will it preserve emoji, accents and non-Latin scripts?',
      a: 'Yes for UPPER/lower/Title/Sentence, which use Unicode-aware case mapping. Identifier styles (camel, snake, kebab) keep Unicode letters as well, so “Über-liste” becomes a valid slug-like identifier.',
    },
    {
      q: 'Why did my acronym change?',
      a: 'Title Case and Sentence case lower-case everything first, so “NASA” becomes “Nasa”. Use Find & Replace afterwards for acronym fixes, or convert those lines separately in UPPER.',
    },
    {
      q: 'Can I undo a conversion?',
      a: 'Your input is never modified — only a separate output is produced, so the original text is always one Copy away.',
    },
  ],
  related: ['slug-generator', 'remove-extra-spaces', 'find-and-replace', 'sort-lines', 'remove-duplicate-lines'],
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Case style',
      default: 'title',
      choices: [
        { value: 'upper', label: 'UPPERCASE' },
        { value: 'lower', label: 'lowercase' },
        { value: 'title', label: 'Title Case' },
        { value: 'sentence', label: 'Sentence case' },
        { value: 'camel', label: 'camelCase' },
        { value: 'snake', label: 'snake_case' },
        { value: 'kebab', label: 'kebab-case' },
        { value: 'constant', label: 'CONSTANT_CASE' },
      ],
    },
    {
      type: 'checkbox',
      key: 'minorWords',
      label: 'Title Case: keep minor words lowercase',
      default: true,
      help: 'Applies to Title Case only',
    },
  ],
  exampleInput: 'the quick brown fox\nJUMPS OVER THE LAKE\nemail newsletter signup',
  exampleOptions: { mode: 'title', minorWords: true },
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const mode = strOpt(options, 'mode', 'title');
    const minorWords = options.minorWords !== false;
    const lines = splitLines(input);

    const converted = lines.map((line) => {
      if (line.trim() === '') return line;
      switch (mode) {
        case 'upper':
          return line.toLocaleUpperCase('en');
        case 'lower':
          return line.toLocaleLowerCase('en');
        case 'sentence':
          return toSentenceCase(line);
        case 'camel': {
          const words = wordsOf(line);
          if (words.length === 0) return line;
          return words
            .map((w, i) => (i === 0 ? w : firstLetterUpper(w)))
            .join('');
        }
        case 'snake':
          return wordsOf(line).join('_');
        case 'kebab':
          return wordsOf(line).join('-');
        case 'constant':
          return wordsOf(line).join('_').toLocaleUpperCase('en');
        case 'title':
        default:
          return toTitleCase(line, minorWords);
      }
    });

    return {
      output: joinLines(converted),
      summary: `Converted ${plural(lines.length, 'line')} to ${
        mode === 'upper'
          ? 'UPPERCASE'
          : mode === 'lower'
            ? 'lowercase'
            : mode === 'title'
              ? 'Title Case'
              : mode === 'sentence'
                ? 'Sentence case'
                : mode === 'camel'
                  ? 'camelCase'
                  : mode === 'snake'
                    ? 'snake_case'
                    : mode === 'kebab'
                      ? 'kebab-case'
                      : 'CONSTANT_CASE'
      }`,
    };
  },
};
