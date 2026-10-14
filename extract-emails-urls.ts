import type { ToolDefinition } from '../types';
import { boolOpt, plural, strOpt } from '../text';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;
const NUMBER_REGEX = /[+-]?\d[\d,.]*/g;

function tidyUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/, '');
}

function extractFrom(input: string): { emails: string[]; urls: string[]; numbers: string[] } {
  const emails = (input.match(EMAIL_REGEX) ?? []).map((m) => m);
  const urls = (input.match(URL_REGEX) ?? []).map(tidyUrl);
  const numbers = (input.match(NUMBER_REGEX) ?? []).map((value) =>
    value.replace(/[.,]+$/, ''),
  );
  return { emails, urls, numbers };
}

function dedupe(values: string[], keyOf: (value: string) => string): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyOf(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const extractEmailsUrlsTool: ToolDefinition = {
  slug: 'extract-emails-urls',
  title: 'Extract Emails, URLs & Numbers',
  category: 'extraction',
  tagline: 'Pull every email address, link or number out of messy text.',
  intro: [
    'Contact details, links and figures hide inside paragraphs, HTML dumps, chat logs and meeting notes. Instead of highlighting them by hand, paste the text and this tool pulls out every email address, URL or number — one per line, optionally deduplicated and sorted.',
    'Extraction is pure client-side pattern matching: your text never reaches a server.',
  ],
  howTo: [
    'Paste the messy text — emails, links or numbers inside it do not need to be separated.',
    'Choose what to extract: emails, URLs, numbers, or all three at once.',
    'Leave deduplicate on to collapse repeats; add sorting if you want an ordered list.',
    'Copy the extracted column(s).',
  ],
  optionsDoc: [
    {
      name: 'Extract',
      description:
        'Pick one target or “All three”. With “All three”, results are grouped: emails first, then URLs, then numbers, each list on its own lines.',
    },
    {
      name: 'Deduplicate',
      description:
        'Removes repeats so each unique value appears exactly once (on by default).',
    },
    {
      name: 'Sort results A→Z',
      description:
        'Alphabetises the extracted values; numbers are ordered numerically when the numeric list is extracted on its own.',
    },
  ],
  faq: [
    {
      q: 'Does it handle links wrapped in brackets or trailing commas?',
      a: 'Yes — trailing punctuation such as periods, commas and closing brackets is trimmed from extracted URLs.',
    },
    {
      q: 'Will it find emails written as images or with [at]?',
      a: 'No — only literal email addresses in standard form. Obfuscated addresses would first need Find & Replace to restore the “@”.',
    },
    {
      q: 'Are numbers matched with decimals and signs?',
      a: 'Yes: 1,234.5 and -42 both match, including comma- or dot-decimal formats.',
    },
    {
      q: 'Is the text I paste uploaded?',
      a: 'No. Extraction runs locally in the browser; nothing is transmitted or stored.',
    },
  ],
  related: ['remove-duplicate-lines', 'find-and-replace', 'sort-lines', 'remove-blank-lines', 'remove-extra-spaces'],
  options: [
    {
      type: 'select',
      key: 'target',
      label: 'Extract',
      default: 'emails',
      choices: [
        { value: 'emails', label: 'Email addresses' },
        { value: 'urls', label: 'URLs / links' },
        { value: 'numbers', label: 'Numbers' },
        { value: 'all', label: 'All three' },
      ],
    },
    { type: 'checkbox', key: 'dedupe', label: 'Deduplicate results', default: true },
    { type: 'checkbox', key: 'sort', label: 'Sort results A→Z', default: false },
  ],
  exampleInput:
    'Hi team — ping ada@example.com or grace@example.com.\nDocs: https://example.com/docs and https://example.com/api\nBudget is 1200.50 and 87 invoices went out.',
  exampleOptions: { target: 'emails', dedupe: true },
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const target = strOpt(options, 'target', 'emails');
    const shouldDedupe = boolOpt(options, 'dedupe', true);
    const shouldSort = boolOpt(options, 'sort', false);
    const { emails, urls, numbers } = extractFrom(input);

    const finish = (
      values: string[],
      keyOf: (value: string) => string = (value) => value,
    ): string[] => {
      const list = shouldDedupe ? dedupe(values, keyOf) : [...values];
      if (shouldSort) {
        list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      }
      return list;
    };

    const parts: string[] = [];
    let total = 0;
    const summarize = (label: string, list: string[]): void => {
      if (list.length > 0) {
        parts.push(list.join('\n'));
        total += list.length;
      } else if (target === 'all') {
        parts.push(`(no ${label} found)`);
      }
    };

    if (target === 'emails' || target === 'all') {
      summarize('emails', finish(emails, (value) => value.toLowerCase()));
    }
    if (target === 'urls' || target === 'all') summarize('urls', finish(urls));
    if (target === 'numbers' || target === 'all') {
      summarize('numbers', finish(numbers));
    }

    const output = parts.join('\n\n');
    if (total === 0) {
      return { output: '', summary: `No ${target === 'all' ? 'values' : target} found` };
    }
    return {
      output,
      summary: `Extracted ${plural(total, 'item')}${
        shouldDedupe ? ' (duplicates removed)' : ''
      }`,
    };
  },
};
