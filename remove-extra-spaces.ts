import type { ToolDefinition } from '../types';
import { boolOpt, joinLines, plural, splitLines } from '../text';

export const removeExtraSpacesTool: ToolDefinition = {
  slug: 'remove-extra-spaces',
  title: 'Remove Extra Spaces',
  category: 'whitespace',
  tagline: 'Trim stray spaces, collapse double spaces and clean tabs.',
  intro: [
    'Hidden whitespace is the quiet saboteur of clean data: trailing spaces that break lookups, double spaces from pasted PDFs, tabs hiding in the middle of columns. This tool scrubs every line — collapsing repeated spaces, trimming line edges and optionally flattening tabs — while leaving intentional spacing inside lines alone.',
    'As with every tool here, processing is local: nothing you paste is uploaded to a server.',
  ],
  howTo: [
    'Paste the text that needs a cleanup pass.',
    'Pick which passes to run: collapse repeated spaces, trim line edges, convert tabs to spaces.',
    'Check the “characters removed” counter to confirm the change is what you expect.',
    'Copy or download the tidy result.',
  ],
  optionsDoc: [
    {
      name: 'Collapse repeated spaces',
      description:
        'Turns runs of two or more spaces into a single space anywhere in the line.',
    },
    {
      name: 'Trim start and end of each line',
      description:
        'Removes leading and trailing spaces and tabs from every line — the most common cause of failed spreadsheet matches.',
    },
    {
      name: 'Replace tabs with one space',
      description:
        'Flattens tab characters into a single space. Keep it off when you are cleaning code or tab-separated data.',
    },
  ],
  faq: [
    {
      q: 'Will it destroy my indentation?',
      a: 'Only if you enable trimming — that removes leading whitespace on purpose. With trim off, collapse still fixes double spaces inside the line while indentation survives.',
    },
    {
      q: 'Does it remove non-breaking spaces?',
      a: 'Not here — non-breaking spaces are invisible Unicode characters, handled specifically by the Remove Invisible Characters tool, which also reports exactly what it removed.',
    },
    {
      q: 'Is my text uploaded?',
      a: 'No. Everything is computed in your browser; no data is sent anywhere.',
    },
    {
      q: 'Can it join wrapped lines back together?',
      a: 'Not directly — use Find & Replace with regex mode to replace newline patterns, or the Join Lines tool planned for the next wave.',
    },
  ],
  related: ['remove-blank-lines', 'remove-invisible-characters', 'remove-duplicate-lines', 'find-and-replace', 'slug-generator'],
  options: [
    { type: 'checkbox', key: 'collapse', label: 'Collapse repeated spaces', default: true },
    { type: 'checkbox', key: 'trimLines', label: 'Trim start and end of each line', default: true },
    { type: 'checkbox', key: 'tabsToSpaces', label: 'Replace tabs with one space', default: false },
  ],
  exampleInput: '  first   item  \nsecond\t\titem\nthird item    ',
  run(input, options) {
    if (input === '') return { output: '', summary: 'Nothing to process' };
    const collapse = boolOpt(options, 'collapse', true);
    const trimLines = boolOpt(options, 'trimLines', true);
    const tabsToSpaces = boolOpt(options, 'tabsToSpaces', false);

    const lines = splitLines(input).map((line) => {
      let value = line;
      if (tabsToSpaces) value = value.replace(/\t+/g, ' ');
      if (collapse) value = value.replace(/ {2,}/g, ' ');
      if (trimLines) value = value.trim();
      return value;
    });
    const output = joinLines(lines);
    const removedChars = input.length - output.length;
    return {
      output,
      summary:
        removedChars === 0
          ? 'Already clean — no extra whitespace found'
          : `Removed ${plural(removedChars, 'extra character')}`,
    };
  },
};
