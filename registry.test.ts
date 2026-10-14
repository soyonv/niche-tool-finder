import { describe, expect, test } from 'bun:test';
import { tools, getTool, defaultOptionsFor } from './registry';

function opts(slug: string, override: Record<string, string | boolean> = {}) {
  const tool = getTool(slug);
  if (!tool) throw new Error(`missing tool ${slug}`);
  return { ...defaultOptionsFor(tool), ...override };
}

function run(slug: string, input: string, override: Record<string, string | boolean> = {}, input2?: string) {
  const tool = getTool(slug);
  if (!tool) throw new Error(`missing tool ${slug}`);
  return tool.run(input, opts(slug, override), input2);
}

describe('registry', () => {
  test('has ten uniquely-slugged tools', () => {
    expect(tools.length).toBe(10);
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(10);
  });

  test('every tool has docs, FAQ, related links and a category', () => {
    for (const tool of tools) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.intro.length).toBeGreaterThanOrEqual(2);
      expect(tool.howTo.length).toBeGreaterThanOrEqual(3);
      expect(tool.faq.length).toBeGreaterThanOrEqual(4);
      expect(tool.related.length).toBe(5);
      expect(tool.category.length).toBeGreaterThan(0);
      for (const slug of tool.related) expect(getTool(slug)).toBeDefined();
      const options = defaultOptionsFor(tool);
      expect(Object.keys(options).length).toBe(tool.options.length);
      const result = tool.run(tool.exampleInput, options, tool.exampleInput2);
      expect(result.summary.length).toBeGreaterThan(0);
    }
  });
});

describe('remove-duplicate-lines', () => {
  test('removes duplicates case-insensitively by default', () => {
    const result = run('remove-duplicate-lines', 'a\nb\nA\nb');
    expect(result.output).toBe('a\nb');
    expect(result.summary).toBe('Removed 2 duplicate lines');
  });

  test('case-sensitive keeps differently-cased lines', () => {
    const result = run('remove-duplicate-lines', 'Apple\napple', { caseSensitive: true });
    expect(result.output).toBe('Apple\napple');
  });

  test('trims before comparing but keeps original text', () => {
    const result = run('remove-duplicate-lines', '  hi  \nhi', { trimLines: true });
    expect(result.output).toBe('  hi  ');
  });

  test('keep=last keeps the last occurrence in its own position', () => {
    const result = run('remove-duplicate-lines', 'old\nx\nold', { keep: 'last' });
    expect(result.output).toBe('x\nold');
    const unchanged = run('remove-duplicate-lines', 'old\nx\nnew', { keep: 'last' });
    expect(unchanged.output).toBe('old\nx\nnew');
  });

  test('blank lines are untouched by default; only repeats collapse when disabled', () => {
    const kept = run('remove-duplicate-lines', 'a\n\nb\n\na');
    expect(kept.output.split('\n')).toEqual(['a', '', 'b', '']);
    const dedupedBlanks = run('remove-duplicate-lines', 'a\n\nb\n\na', { keepBlanks: false });
    expect(dedupedBlanks.output.split('\n')).toEqual(['a', '', 'b']);
  });

  test('ignore punctuation merges cat. and cat', () => {
    const result = run('remove-duplicate-lines', 'cat.\ncat', { ignorePunctuation: true });
    expect(result.output).toBe('cat.');
  });

  test('empty input is safe', () => {
    expect(run('remove-duplicate-lines', '').output).toBe('');
  });
});

describe('remove-blank-lines', () => {
  test('removes empty and whitespace-only lines by default', () => {
    const result = run('remove-blank-lines', 'a\n\n  \nb');
    expect(result.output).toBe('a\nb');
    expect(result.summary).toBe('Removed 2 blank lines');
  });

  test('strict mode keeps whitespace-only lines', () => {
    const result = run('remove-blank-lines', 'a\n\n  \nb', { whitespaceOnly: false });
    expect(result.output).toBe('a\n  \nb');
  });
});

describe('sort-lines', () => {
  test('alphabetical ignores case', () => {
    expect(run('sort-lines', 'banana\nApple').output).toBe('Apple\nbanana');
  });

  test('natural order puts item2 before item10', () => {
    const result = run('sort-lines', 'item10\nitem2', { mode: 'natural' });
    expect(result.output).toBe('item2\nitem10');
  });

  test('numeric sorts by first number and keeps non-numeric last', () => {
    const result = run('sort-lines', 'zzz\n10 apples\n2 apples', { mode: 'numeric', blanksLast: false });
    expect(result.output).toBe('2 apples\n10 apples\nzzz');
  });

  test('blanks sink to the bottom', () => {
    const result = run('sort-lines', '\nb\n\na', { mode: 'asc', blanksLast: true });
    expect(result.output).toBe('a\nb\n\n');
  });

  test('shuffle is deterministic for the same input', () => {
    const input = '1\n2\n3\n4\n5\n6\n7\n8';
    const first = run('sort-lines', input, { mode: 'shuffle' });
    const second = run('sort-lines', input, { mode: 'shuffle' });
    expect(first.output).toBe(second.output);
    expect(first.output.split('\n').sort().join(',')).toBe('1,2,3,4,5,6,7,8');
  });

  test('reverse flips order', () => {
    expect(run('sort-lines', 'a\nb\nc', { mode: 'reverse' }).output).toBe('c\nb\na');
  });
});

describe('case-converter', () => {
  test('upper and lower', () => {
    expect(run('case-converter', 'Hello World', { mode: 'upper' }).output).toBe('HELLO WORLD');
    expect(run('case-converter', 'Hello World', { mode: 'lower' }).output).toBe('hello world');
  });

  test('title case keeps minor words lowercase', () => {
    const result = run('case-converter', 'the war of the worlds', { mode: 'title' });
    expect(result.output).toBe('The War of the Worlds');
  });

  test('title case can uppercase everything when minor words off', () => {
    const result = run('case-converter', 'the war of the worlds', { mode: 'title', minorWords: false });
    expect(result.output).toBe('The War Of The Worlds');
  });

  test('sentence case capitalises sentence starts', () => {
    const result = run('case-converter', 'hello there. this is fine!', { mode: 'sentence' });
    expect(result.output).toBe('Hello there. This is fine!');
  });

  test('identifier styles', () => {
    expect(run('case-converter', 'my variable name', { mode: 'camel' }).output).toBe('myVariableName');
    expect(run('case-converter', 'My Variable Name', { mode: 'snake' }).output).toBe('my_variable_name');
    expect(run('case-converter', 'My Variable Name', { mode: 'kebab' }).output).toBe('my-variable-name');
    expect(run('case-converter', 'my variable name', { mode: 'constant' }).output).toBe('MY_VARIABLE_NAME');
  });

  test('blank lines pass through untouched', () => {
    expect(run('case-converter', 'a\n\nB', { mode: 'upper' }).output).toBe('A\n\nB');
  });
});

describe('find-and-replace', () => {
  test('literal replacement counts matches', () => {
    const result = run('find-and-replace', 'cat cat dog', {}, undefined);
    const withFind = run('find-and-replace', 'cat cat dog', { find: 'cat', replace: 'bird' });
    expect(result.summary).toBe('Enter text to find');
    expect(withFind.output).toBe('bird bird dog');
    expect(withFind.summary).toBe('Made 2 replacements');
  });

  test('regex mode works with case-insensitive default', () => {
    const result = run('find-and-replace', 'Cat cat CAT', { find: 'c.t', replace: 'fox', regex: true });
    expect(result.output).toBe('fox fox fox');
  });

  test('invalid regex returns original text with an error summary', () => {
    const result = run('find-and-replace', 'keep me', { find: '([', replace: 'x', regex: true });
    expect(result.output).toBe('keep me');
    expect(result.summary).toContain('Invalid');
  });

  test('escaped newline in replacement becomes a real newline', () => {
    const result = run('find-and-replace', 'a, b, c', { find: ', ', replace: '\\n' });
    expect(result.output).toBe('a\nb\nc');
  });

  test('no matches is reported clearly', () => {
    const result = run('find-and-replace', 'nothing here', { find: 'zebra' });
    expect(result.output).toBe('nothing here');
    expect(result.summary).toBe('No matches found');
  });
});

describe('remove-extra-spaces', () => {
  test('collapses and trims by default', () => {
    const result = run('remove-extra-spaces', '  a   b  \nc  d');
    expect(result.output).toBe('a b\nc d');
  });

  test('tabs converted only when enabled', () => {
    const kept = run('remove-extra-spaces', 'a\tb', { collapse: false, trimLines: false });
    expect(kept.output).toBe('a\tb');
    const converted = run('remove-extra-spaces', 'a\t\tb', { tabsToSpaces: true, collapse: false, trimLines: false });
    expect(converted.output).toBe('a b');
  });

  test('reports when already clean', () => {
    const result = run('remove-extra-spaces', 'clean');
    expect(result.summary).toContain('Already clean');
  });
});

describe('slug-generator', () => {
  test('transliterates accents and lowercases', () => {
    const result = run('slug-generator', 'Cómo hacer el pan!');
    expect(result.output).toBe('como-hacer-el-pan');
  });

  test('underscore separator', () => {
    const result = run('slug-generator', 'My Great Post', { separator: '_' });
    expect(result.output).toBe('my_great_post');
  });

  test('keeps non-latin letters when transliteration off', () => {
    const result = run('slug-generator', '日本語のタイトル', { transliterate: false });
    expect(result.output).toBe('日本語のタイトル');
  });

  test('one slug per line, lines stay aligned', () => {
    const result = run('slug-generator', 'First Title\nSecond Title');
    expect(result.output).toBe('first-title\nsecond-title');
  });
});

describe('remove-invisible-characters', () => {
  test('removes zero-width spaces and reports them', () => {
    const result = run('remove-invisible-characters', 'a\u200Bb\u200Bc');
    expect(result.output).toBe('abc');
    expect(result.summary).toContain('2');
    expect(result.detail).toContain('ZERO WIDTH SPACE');
  });

  test('non-breaking space becomes a normal space', () => {
    const result = run('remove-invisible-characters', 'old\u00A0style');
    expect(result.output).toBe('old style');
  });

  test('disabled groups are left alone', () => {
    const result = run('remove-invisible-characters', 'a\u200Bb', { zeroWidth: false });
    expect(result.output).toBe('a\u200Bb');
    expect(result.summary).toBe('No invisible characters found');
  });

  test('directional override characters are removed when enabled', () => {
    const result = run('remove-invisible-characters', 'safe\u202Etxt');
    expect(result.output).toBe('safetxt');
    expect(result.detail).toContain('RIGHT-TO-LEFT OVERRIDE');
  });
});

describe('text-diff', () => {
  test('identical texts report no differences', () => {
    const result = run('text-diff', 'same\nlines', {}, 'same\nlines');
    expect(result.summary).toBe('No differences found');
  });

  test('detects added and removed lines', () => {
    const result = run('text-diff', 'a\nb\nc', {}, 'a\nx\nc\nd');
    expect(result.summary).toBe('2 added · 1 removed');
    expect(result.output.split('\n')).toContain('- b');
    expect(result.output.split('\n')).toContain('+ x');
    expect(result.output.split('\n')).toContain('+ d');
  });

  test('ignore case hides casing-only differences', () => {
    const result = run('text-diff', 'Hello', { ignoreCase: true }, 'hello');
    expect(result.summary).toBe('No differences found');
  });

  test('handles empty second side', () => {
    const result = run('text-diff', 'a\nb', {}, '');
    expect(result.summary).toBe('0 added · 2 removed');
  });
});

describe('extract-emails-urls', () => {
  test('extracts and dedupes emails', () => {
    const input = 'Write to ada@example.com or ADA@example.com.\nAlso grace@example.com';
    const result = run('extract-emails-urls', input, { target: 'emails', dedupe: true });
    expect(result.output.split('\n').length).toBe(2);
    expect(result.output).toContain('ada@example.com');
  });

  test('urls drop trailing punctuation', () => {
    const result = run('extract-emails-urls', 'See https://example.com/docs.', { target: 'urls' });
    expect(result.output).toBe('https://example.com/docs');
  });

  test('numbers include decimals and signs', () => {
    const result = run('extract-emails-urls', 'totals: -42 and 1,234.50 done', { target: 'numbers' });
    expect(result.output).toContain('-42');
    expect(result.output).toContain('1,234.50');
  });

  test('all groups are separated by blank lines', () => {
    const result = run('extract-emails-urls', 'ada@example.com https://example.com 99', { target: 'all' });
    expect(result.output.split('\n\n').length).toBe(3);
  });

  test('nothing found is reported', () => {
    const result = run('extract-emails-urls', 'no addresses here', { target: 'emails' });
    expect(result.summary).toContain('No');
  });
});
