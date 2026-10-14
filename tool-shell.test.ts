import { beforeAll, describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';

/**
 * Drives the real tool shell against the actual built page HTML from
 * dist/tools/remove-duplicate-lines/index.html, proving that markup IDs,
 * option wiring and the transform pipeline all line up.
 */

let window: InstanceType<typeof Window>;
let document: Document;
let input: HTMLTextAreaElement;
let output: HTMLTextAreaElement;
let summary: HTMLElement;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** happy-dom events are not the same type as the DOM lib's Event. */
function fire(target: EventTarget, type: string): void {
  (target as unknown as { dispatchEvent: (event: unknown) => boolean }).dispatchEvent(
    new window.Event(type),
  );
}

beforeAll(async () => {
  const html = await Bun.file('dist/tools/remove-duplicate-lines/index.html').text();
  window = new Window();
  const doc = window.document;
  doc.write(html);

  // Expose the happy-dom environment as globals so the module can initialise.
  const globals = globalThis as Record<string, unknown>;
  globals.window = window;
  globals.document = doc;
  globals.localStorage = window.localStorage;
  globals.navigator = window.navigator;
  globals.HTMLInputElement = window.HTMLInputElement;
  globals.HTMLSelectElement = window.HTMLSelectElement;
  globals.HTMLTextAreaElement = window.HTMLTextAreaElement;
  globals.HTMLElement = window.HTMLElement;
  globals.Event = window.Event;

  document = doc as unknown as Document;
  input = document.querySelector('#tool-input') as unknown as HTMLTextAreaElement;
  output = document.querySelector('#tool-output') as unknown as HTMLTextAreaElement;
  summary = document.querySelector('#tool-summary') as unknown as HTMLElement;

  await import('./tool-shell.ts');
});

function setInput(value: string): void {
  input.value = value;
  fire(input, 'input');
}

describe('tool shell on the built page', () => {
  test('built page contains the shell markup and SEO elements', () => {
    expect(document.querySelector('[data-tool-root]')).not.toBeNull();
    expect(document.querySelectorAll('[data-option-key]').length).toBe(5);
    expect(document.querySelector('h1')?.textContent).toContain('Remove Duplicate Lines');
    expect(document.title).toContain('Remove Duplicate Lines Online');
    expect(document.querySelector('link[rel="canonical"]')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-action]').length).toBe(5);
  });

  test('initialises and reports empty input', () => {
    expect(summary.textContent).toBe('Nothing to process');
    expect(output.value).toBe('');
  });

  test('cleans pasted text after the debounce', async () => {
    setInput('ada@example.com\nADA@example.com\nada@example.com\nbob@example.com');
    await wait(260);
    expect(output.value).toBe('ada@example.com\nbob@example.com');
    expect(summary.textContent).toBe('Removed 2 duplicate lines');
  });

  test('option changes re-run the transform', async () => {
    setInput('Apple\napple');
    await wait(260);
    expect(output.value).toBe('Apple');

    const caseSensitive = document.querySelector(
      '[data-option-key="caseSensitive"]',
    ) as unknown as HTMLInputElement;
    caseSensitive.checked = true;
    fire(caseSensitive, 'change');
    await wait(140);
    expect(output.value).toBe('Apple\napple');

    // Preference is persisted locally, text is not.
    expect(window.localStorage.getItem('scrubkit:opts:remove-duplicate-lines')).toContain(
      '"caseSensitive":true',
    );
    caseSensitive.checked = false;
    fire(caseSensitive, 'change');
    await wait(140);
  });

  test('select option changes re-run the transform', async () => {
    const keep = document.querySelector(
      '[data-option-key="keep"]',
    ) as unknown as HTMLSelectElement;
    setInput('one\ntwo\none');
    await wait(260);
    keep.value = 'last';
    fire(keep, 'change');
    await wait(140);
    expect(output.value).toBe('two\none');
    keep.value = 'first';
    fire(keep, 'change');
    await wait(140);
  });

  test('clear, example and undo behave as a workflow', async () => {
    const clear = document.querySelector('[data-action="clear"]') as unknown as HTMLButtonElement;
    const example = document.querySelector('[data-action="example"]') as unknown as HTMLButtonElement;
    const undo = document.querySelector('[data-action="undo"]') as unknown as HTMLButtonElement;

    example.click();
    await wait(80);
    expect(input.value.length).toBeGreaterThan(10);
    expect(output.value.length).toBeGreaterThan(5);

    clear.click();
    await wait(80);
    expect(input.value).toBe('');
    expect(summary.textContent).toBe('Nothing to process');

    undo.click();
    await wait(80);
    expect(input.value.length).toBeGreaterThan(10);
  });
});
