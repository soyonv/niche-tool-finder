import type { ToolResult, ToolOptions } from '../lib/types';
import { getTool } from '../lib/registry';

interface WorkerRequest {
  id: number;
  slug: string;
  input: string;
  input2?: string;
  options: ToolOptions;
}

interface WorkerResponse extends ToolResult {
  id: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
};

scope.onmessage = (event) => {
  const { id, slug, input, input2, options } = event.data;
  try {
    const tool = getTool(slug);
    if (!tool) throw new Error(`Unknown tool: ${slug}`);
    const result = tool.run(input, options, input2);
    scope.postMessage({ id, ...result });
  } catch (error) {
    scope.postMessage({
      id,
      output: input,
      summary: 'Something went wrong while processing',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};
