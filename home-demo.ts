import { removeDuplicateLinesTool } from '../lib/tools/remove-duplicate-lines';

const input = document.querySelector<HTMLTextAreaElement>('#demo-input');
const output = document.querySelector<HTMLElement>('#demo-output');
const status = document.querySelector<HTMLElement>('#demo-status');

if (input && output && status) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = (): void => {
    const result = removeDuplicateLinesTool.run(input.value, {
      caseSensitive: false,
      trimLines: true,
      keepBlanks: false,
      keep: 'first',
    });
    output.textContent = result.output || '—';
    status.textContent = result.summary;
  };
  input.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, 120);
  });
  run();
}
