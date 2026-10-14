import { getTool } from '../lib/registry';

type ToolOptions = Record<string, string | boolean>;

interface ToolResultLite {
  output: string;
  summary: string;
  detail?: string;
}

const WORKER_THRESHOLD = 100 * 1024;
const STORAGE_PREFIX = 'scrubkit:opts:';

function q<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function qa<T extends Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function countWords(text: string): number {
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

function statText(text: string): string {
  const lines = text === '' ? 0 : text.split(/\r?\n/).length;
  return `${lines} lines · ${countWords(text)} words · ${text.length} chars`;
}

export function initToolShell(root: HTMLElement): void {
  const slug = root.dataset.toolSlug ?? 'tool';
  const dual = root.dataset.toolDual === 'true';
  const example = JSON.parse(root.dataset.toolExample ?? 'null') as {
    input?: string;
    input2?: string;
    options?: ToolOptions;
  } | null;

  const input = q<HTMLTextAreaElement>(root, '#tool-input')!;
  const input2 = dual ? q<HTMLTextAreaElement>(root, '#tool-input-2') : null;
  const output = q<HTMLTextAreaElement>(root, '#tool-output')!;
  const summaryEl = q<HTMLElement>(root, '#tool-summary')!;
  const detailEl = q<HTMLElement>(root, '#tool-detail');
  const inputStatEl = q<HTMLElement>(root, '#tool-input-stat');
  const outputStatEl = q<HTMLElement>(root, '#tool-output-stat');
  const optionControls = qa<HTMLInputElement | HTMLSelectElement>(root, '[data-option-key]');

  if (!input || !output || !summaryEl) return;

  const tool = getTool(slug);
  if (!tool) return;
  const runTool = (value: string, options: ToolOptions, second?: string) =>
    tool.run(value, options, second);

  // ---- options -------------------------------------------------------------
  const storageKey = STORAGE_PREFIX + slug;

  function readStoredOptions(): ToolOptions | null {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as ToolOptions) : null;
    } catch {
      return null;
    }
  }

  function applyOptions(options: ToolOptions): void {
    for (const control of optionControls) {
      const key = control.dataset.optionKey;
      if (!key || !(key in options)) continue;
      const value = options[key];
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        control.checked = Boolean(value);
      } else if (control instanceof HTMLSelectElement || control instanceof HTMLInputElement) {
        control.value = String(value);
      }
    }
  }

  function applyDefaultOptions(): void {
    for (const control of optionControls) {
      const key = control.dataset.optionKey;
      if (!key) continue;
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        control.checked = control.defaultChecked;
      } else if (control instanceof HTMLSelectElement) {
        control.value = control.dataset.default ?? control.value;
      }
    }
  }

  function readOptions(): ToolOptions {
    const options: ToolOptions = {};
    for (const control of optionControls) {
      const key = control.dataset.optionKey;
      if (!key) continue;
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        options[key] = control.checked;
      } else {
        options[key] = control.value;
      }
    }
    return options;
  }

  function saveOptions(options: ToolOptions): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(options));
    } catch {
      /* storage may be unavailable; preferences are optional */
    }
  }

  applyDefaultOptions();
  const stored = readStoredOptions();
  if (stored) applyOptions(stored);

  // ---- processing ----------------------------------------------------------
  let latestRequest = 0;
  let worker: Worker | null = null;
  let workerBroken = false;

  function ensureWorker(): Worker | null {
    if (workerBroken) return null;
    if (worker) return worker;
    try {
      worker = new Worker(new URL('../workers/processor.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (event: MessageEvent<ToolResultLite & { id: number }>) => {
        if (event.data.id !== latestRequest) return;
        render(event.data);
      };
      worker.onerror = () => {
        workerBroken = true;
        worker?.terminate();
        worker = null;
      };
      return worker;
    } catch {
      workerBroken = true;
      return null;
    }
  }

  function render(result: ToolResultLite): void {
    output.value = result.output;
    summaryEl!.textContent = result.summary;
    if (detailEl) {
      detailEl.textContent = result.detail ?? '';
      detailEl.hidden = !result.detail;
    }
    if (inputStatEl) inputStatEl.textContent = statText(input.value);
    if (outputStatEl) outputStatEl.textContent = statText(result.output);
  }

  function processNow(): void {
    latestRequest += 1;
    const id = latestRequest;
    const text = input.value;
    const text2 = input2 ? input2.value : undefined;
    const options = readOptions();
    const size = text.length + (text2?.length ?? 0);

    if (size > WORKER_THRESHOLD) {
      const activeWorker = ensureWorker();
      if (activeWorker) {
        if (summaryEl) summaryEl.textContent = 'Processing…';
        activeWorker.postMessage({ id, slug, input: text, input2: text2, options });
        return;
      }
    }
    try {
      const result = runTool(text, options, text2);
      if (id === latestRequest) render(result);
    } catch (error) {
      render({
        output: text,
        summary: 'Something went wrong while processing',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleProcess(delay = 150): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processNow, delay);
  }

  input.addEventListener('input', () => scheduleProcess());
  input2?.addEventListener('input', () => scheduleProcess());
  for (const control of optionControls) {
    control.addEventListener('change', () => {
      saveOptions(readOptions());
      scheduleProcess(40);
    });
    if (control instanceof HTMLInputElement && control.type === 'text') {
      control.addEventListener('input', () => {
        saveOptions(readOptions());
        scheduleProcess(250);
      });
    }
  }

  // ---- actions -------------------------------------------------------------
  const undoStack: { input: string; input2?: string }[] = [];
  const MAX_UNDO = 20;

  function snapshot(): void {
    undoStack.push({ input: input.value, input2: input2?.value });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  const copyButton = q<HTMLButtonElement>(root, '[data-action="copy"]');
  const downloadButton = q<HTMLButtonElement>(root, '[data-action="download"]');
  const clearButton = q<HTMLButtonElement>(root, '[data-action="clear"]');
  const undoButton = q<HTMLButtonElement>(root, '[data-action="undo"]');
  const exampleButton = q<HTMLButtonElement>(root, '[data-action="example"]');

  copyButton?.addEventListener('click', async () => {
    const text = output.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      output.select();
      document.execCommand('copy');
    }
    const original = copyButton.textContent;
    copyButton.textContent = 'Copied ✓';
    setTimeout(() => {
      copyButton.textContent = original;
    }, 1400);
  });

  downloadButton?.addEventListener('click', () => {
    const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug}-output.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });

  clearButton?.addEventListener('click', () => {
    snapshot();
    input.value = '';
    if (input2) input2.value = '';
    processNow();
    input.focus();
  });

  undoButton?.addEventListener('click', () => {
    const previous = undoStack.pop();
    if (!previous) return;
    input.value = previous.input;
    if (input2 && typeof previous.input2 === 'string') input2.value = previous.input2;
    processNow();
  });

  exampleButton?.addEventListener('click', () => {
    snapshot();
    input.value = example?.input ?? '';
    if (input2 && example?.input2) input2.value = example.input2;
    if (example?.options) applyOptions(example.options);
    processNow();
  });

  processNow();
}

const root = document.querySelector<HTMLElement>('[data-tool-root]');
if (root) initToolShell(root);
