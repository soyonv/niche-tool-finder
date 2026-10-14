export type OptionDef =
  | {
      type: 'checkbox';
      key: string;
      label: string;
      default?: boolean;
      help?: string;
    }
  | {
      type: 'select';
      key: string;
      label: string;
      default: string;
      choices: { value: string; label: string }[];
      help?: string;
    }
  | {
      type: 'text';
      key: string;
      label: string;
      default?: string;
      placeholder?: string;
      help?: string;
    };

export type ToolOptions = Record<string, string | boolean>;

export interface ToolResult {
  output: string;
  summary: string;
  detail?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface DocItem {
  name: string;
  description: string;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  intro: string[];
  howTo: string[];
  optionsDoc: DocItem[];
  faq: FaqItem[];
  related: string[];
  options: OptionDef[];
  dual?: boolean;
  secondInputLabel?: string;
  exampleInput: string;
  exampleInput2?: string;
  exampleOptions?: ToolOptions;
  run: (input: string, options: ToolOptions, input2?: string) => ToolResult;
}
