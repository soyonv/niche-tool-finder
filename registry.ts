import type { ToolDefinition } from './types';
import { removeDuplicateLinesTool } from './tools/remove-duplicate-lines';
import { removeBlankLinesTool } from './tools/remove-blank-lines';
import { sortLinesTool } from './tools/sort-lines';
import { caseConverterTool } from './tools/case-converter';
import { findAndReplaceTool } from './tools/find-and-replace';
import { removeExtraSpacesTool } from './tools/remove-extra-spaces';
import { slugGeneratorTool } from './tools/slug-generator';
import { removeInvisibleCharactersTool } from './tools/remove-invisible-characters';
import { textDiffTool } from './tools/text-diff';
import { extractEmailsUrlsTool } from './tools/extract-emails-urls';

export const tools: ToolDefinition[] = [
  removeDuplicateLinesTool,
  removeBlankLinesTool,
  sortLinesTool,
  caseConverterTool,
  findAndReplaceTool,
  removeExtraSpacesTool,
  slugGeneratorTool,
  removeInvisibleCharactersTool,
  textDiffTool,
  extractEmailsUrlsTool,
];

const toolMap = new Map<string, ToolDefinition>(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): ToolDefinition | undefined {
  return toolMap.get(slug);
}

export function defaultOptionsFor(tool: ToolDefinition): Record<string, string | boolean> {
  const options: Record<string, string | boolean> = {};
  for (const option of tool.options) {
    if (option.type === 'checkbox') options[option.key] = option.default ?? false;
    else if (option.type === 'select') options[option.key] = option.default;
    else options[option.key] = option.default ?? '';
  }
  return options;
}
