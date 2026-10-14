export interface CategoryDef {
  slug: string;
  name: string;
  blurb: string;
  intro: string[];
}

export const categories: CategoryDef[] = [
  {
    slug: 'cleaning',
    name: 'Text Cleaning',
    blurb: 'Dedupe, replace and normalise the messy parts of any list.',
    intro: [
      'Text cleaning covers the transformations you reach for most often: removing duplicate lines, replacing text across a document, and turning titles into tidy slugs. Each tool here is a single focused operation you can run in seconds.',
      'All tools process your text inside the browser. Nothing is uploaded, nothing is stored, and there is no usage cap.',
    ],
  },
  {
    slug: 'sorting',
    name: 'Sorting & Ordering',
    blurb: 'Order lists alphabetically, numerically, by length — or shuffle.',
    intro: [
      'Order matters: sorted lists make duplicates obvious, comparisons reliable and reviews faster. These tools handle alphabetical, natural (number-aware), numeric and length-based ordering, plus reversal and shuffling.',
      'Sorting runs locally in your browser — the list never leaves your device.',
    ],
  },
  {
    slug: 'case',
    name: 'Case Conversion',
    blurb: 'Fix shouting caps, sentence case, camelCase and friends.',
    intro: [
      'Capitalisation problems come from everywhere: legacy databases shouting in ALL CAPS, headlines written in sentence case, code variables in the wrong convention. These tools re-case whole lists line by line.',
      'Conversion happens in your browser with no upload, no account and no limit.',
    ],
  },
  {
    slug: 'whitespace',
    name: 'Whitespace & Blank Lines',
    blurb: 'Strip empty lines, double spaces, tabs and trailing junk.',
    intro: [
      'Whitespace is invisible until it breaks an import: a trailing space defeats a lookup, a blank row fails a CSV schema, a stray tab shifts a column. The tools in this category remove exactly that — nothing more.',
      'Everything runs locally: paste, clean, copy. Your text is never sent anywhere.',
    ],
  },
  {
    slug: 'unicode',
    name: 'Unicode & Invisible Characters',
    blurb: 'Find hidden zero-width, non-breaking and directional characters.',
    intro: [
      'Invisible Unicode characters are the hardest text bugs to see: zero-width spaces from PDFs, non-breaking spaces from web pages, hidden directional overrides that reverse your text. These tools detect, name and remove them.',
      'Detection is pure client-side pattern matching — your text stays on your machine.',
    ],
  },
  {
    slug: 'extraction',
    name: 'Extraction',
    blurb: 'Pull emails, links and numbers out of walls of text.',
    intro: [
      'Contact details, links and figures usually arrive mixed into paragraphs, chat logs or HTML. The extraction tools pull them out as clean lists, with dedupe and sorting built in.',
      'Extraction runs in your browser, so the source text is never uploaded.',
    ],
  },
  {
    slug: 'diff',
    name: 'Comparing Text',
    blurb: 'See exactly what changed between two versions.',
    intro: [
      'Comparing two versions of a text by eye is slow and unreliable. The diff tools here match lines automatically and mark what was removed and what was added.',
      'Comparison happens locally, including large inputs processed in a background Web Worker.',
    ],
  },
];

export interface UseCaseDef {
  slug: string;
  title: string;
  lede: string;
  sections: { heading: string; body: string[] }[];
  tools: string[];
}

export const useCases: UseCaseDef[] = [
  {
    slug: 'clean-a-pasted-email-list',
    title: 'Clean a pasted email list',
    lede: 'Turn a messy block of copied email addresses into a clean, deduplicated column — without uploading your contacts anywhere.',
    sections: [
      {
        heading: 'The problem',
        body: [
          'Email addresses get collected everywhere: conference sign-ups, newsletter exports, forwarded introductions, PDFs. When you paste them together you end up with duplicates, trailing periods, lines that carry a name alongside the address, and the occasional blank row.',
          'The usual fix — uploading the list to some free online tool — means your contacts leave your machine. For a work list or a client list, that is not a trade you should have to make.',
        ],
      },
      {
        heading: 'The workflow',
        body: [
          'Paste everything into the Extract Emails tool and pull out just the addresses: it matches only valid email syntax, drops duplicates on request, and outputs one address per line.',
          'Run Remove Duplicate Lines next if you want a second pass with different comparison rules (for example keeping the last occurrence).',
          'Finish with Remove Blank Lines so the list imports cleanly into your email tool, and Sort Lines if you want an ordered column.',
        ],
      },
      {
        heading: 'Why it stays private',
        body: [
          'Every step above runs as JavaScript inside your browser tab. There is no upload step, no server processing and no stored copy — closing the tab discards everything. That is the whole reason ScrubKit exists.',
        ],
      },
    ],
    tools: ['extract-emails-urls', 'remove-duplicate-lines', 'remove-blank-lines', 'sort-lines'],
  },
  {
    slug: 'tidy-a-crm-export',
    title: 'Tidy up a messy CRM export',
    lede: 'Fix spacing, casing and stray characters in a pasted column of names, titles or companies before you import it back.',
    sections: [
      {
        heading: 'The problem',
        body: [
          'CRM and spreadsheet exports carry scars: trailing spaces that break merges, company names in three different casings, double spaces from a sloppy form field, and occasionally an invisible character imported from an old system.',
          'Import it as-is and you get duplicate accounts, failed matches and fields that look identical but are not.',
        ],
      },
      {
        heading: 'The workflow',
        body: [
          'Start with Remove Extra Spaces — it trims line edges, collapses double spaces and optionally flattens tabs, and reports how many characters it removed.',
          'Run Remove Invisible Characters next with all groups enabled; its report names exactly which hidden characters were present, which is often the real root cause.',
          'Finish with Case Converter (Title Case for company names, Sentence case for job titles) and a final Remove Duplicate Lines pass to catch near-identical rows.',
        ],
      },
      {
        heading: 'Keep the original',
        body: [
          'These tools never modify your input — they produce a separate output. Your pasted column stays exactly as it was, so you can re-run with different options, compare results with Text Diff, and only copy the version you trust.',
        ],
      },
    ],
    tools: ['remove-extra-spaces', 'remove-invisible-characters', 'case-converter', 'remove-duplicate-lines', 'text-diff'],
  },
  {
    slug: 'dedupe-a-keyword-list',
    title: 'Dedupe and sort a keyword list',
    lede: 'Take a keyword export full of duplicates, mixed cases and inconsistent order and make it a clean, sorted, unique list.',
    sections: [
      {
        heading: 'The problem',
        body: [
          'Keyword tools happily export the same query in five shapes: “seo tools”, “SEO tools”, “seo tools ”, “seo tools?” and so on. Pasted together, duplicates hide because sorting never happened and comparisons were case-sensitive somewhere along the way.',
          'A list you cannot trust makes search-volume estimates and content plans unreliable.',
        ],
      },
      {
        heading: 'The workflow',
        body: [
          'Paste the list into Remove Duplicate Lines with case-insensitive comparison on and “ignore surrounding spaces” on — that collapses the variants most exporters produce.',
          'Enable “ignore punctuation” as a second pass if you also want to merge question marks and trailing symbols.',
          'Sort Lines (natural order) to group related terms, then Slug Generator if you need URL-ready versions of the same list — output stays line-aligned with your input.',
        ],
      },
      {
        heading: 'Check your work',
        body: [
          'Paste the original list on the left of Text Diff and the cleaned list on the right: what was removed is shown line by line, so you can verify the dedupe did exactly what you intended and nothing more.',
        ],
      },
    ],
    tools: ['remove-duplicate-lines', 'sort-lines', 'slug-generator', 'text-diff', 'remove-blank-lines'],
  },
];

export interface GuideDef {
  slug: string;
  title: string;
  lede: string;
  sections: { heading: string; paragraphs: string[] }[];
  tools: string[];
}

export const guides: GuideDef[] = [
  {
    slug: 'remove-duplicate-lines-without-excel',
    title: 'How to remove duplicate lines from any list (without Excel)',
    lede: 'Spreadsheets are overkill — and a privacy risk — for a job that should take seconds. Here is a faster, local way to deduplicate any list of lines.',
    sections: [
      {
        heading: 'Why spreadsheet dedupe disappoints',
        paragraphs: [
          'Spreadsheet "remove duplicates" needs a column selected, silently merges rows that differ only in case or spacing, and requires you to upload or paste your data into a document you may not control. For a quick list — emails from an email thread, log lines, a copied menu of options — it is far more ceremony than the job deserves.',
          'Text deduplication is a string problem, not a spreadsheet problem: read the lines, compare them under a chosen rule, keep the ones that win.',
        ],
      },
      {
        heading: 'The rule matters more than the tool',
        paragraphs: [
          'Three decisions decide whether dedupe is right or destructive: whether "Apple" and "apple" are the same line, whether "hello" and "  hello  " are the same line, and whether punctuation counts ("cat." vs "cat").',
          'There is no universally correct answer — a brand list usually wants case-sensitivity, an email list usually does not. That is why a good dedupe tool exposes all three switches instead of guessing for you.',
        ],
      },
      {
        heading: 'A workflow that keeps your data local',
        paragraphs: [
          'Paste the list into Remove Duplicate Lines, set the comparison rules, and choose to keep the first or last occurrence. Keep the default that leaves blank lines untouched if your list uses spacing for grouping.',
          'Sort the result so you can eyeball it, then run Remove Blank Lines if you want a tight import-ready column. If the list is precious, keep the original paste and diff the before/after with Text Diff — the input to any tool is never modified.',
        ],
      },
      {
        heading: 'When to reach for something bigger',
        paragraphs: [
          'If your duplicates span several columns, or rows need to be merged on a key rather than the whole line, you genuinely want a spreadsheet or a database. For single-column lists, a browser tool is faster, and one that runs entirely client-side keeps the list on your machine.',
        ],
      },
    ],
    tools: ['remove-duplicate-lines', 'sort-lines', 'remove-blank-lines', 'text-diff'],
  },
  {
    slug: 'invisible-characters-in-pasted-text',
    title: 'Invisible characters: why pasted text keeps breaking',
    lede: 'Your data is identical but refuses to match. The culprit is usually a character you cannot see — here is how to find and remove it.',
    sections: [
      {
        heading: 'What invisible characters are',
        paragraphs: [
          'Unicode contains characters that render as nothing: a zero-width space (U+200B) that word processors insert for line breaking, a non-breaking space (U+00A0) that web pages use instead of a plain space, a soft hyphen (U+00AD), a byte-order mark (U+FEFF), and directional formatting marks that can even reverse how text displays.',
          'They are legitimate characters with legitimate purposes — which is exactly why they survive copy-paste. The string "ada@example.com" with a zero-width space inside looks correct and matches nothing.',
        ],
      },
      {
        heading: 'How to recognise the symptoms',
        paragraphs: [
          'Classic signs: a lookup or VLOOKUP fails on one row; a username refuses to log in; a search for a phrase finds nothing although the words are visible; an import reports "unexpected character"; two "identical" strings compare unequal in code.',
          'You cannot debug these by staring at the text, because there is nothing to see. The fix is to detect them programmatically.',
        ],
      },
      {
        heading: 'How to remove them safely',
        paragraphs: [
          'Paste the affected text into Remove Invisible Characters with the groups enabled. It scans for the whole family, removes or normalises them, and — crucially — reports each character name with a count, so you learn what went wrong, not just that something changed.',
          'If non-breaking spaces were present, they are converted to regular spaces rather than deleted, so words do not fuse together. Everything runs locally; the pasted text never leaves your browser.',
        ],
      },
      {
        heading: 'Preventing a relapse',
        paragraphs: [
          'Paste from plain text when you can, re-export CSVs rather than copying cells out of formatted tables, and run the detector as a first step whenever "identical" strings refuse to match. For lists that mix invisible characters with stray spaces, follow up with Remove Extra Spaces for a complete clean.',
        ],
      },
    ],
    tools: ['remove-invisible-characters', 'remove-extra-spaces', 'find-and-replace', 'remove-blank-lines'],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const homeFaqs: FaqItem[] = [
  {
    q: 'Is ScrubKit really free?',
    a: 'Yes. Every tool is free with no signup, no usage caps and no “3 free runs per day” limit. The tools are small, static web pages that run on your device, so serving them costs almost nothing.',
  },
  {
    q: 'Do you see the text I paste?',
    a: 'No. Processing happens entirely inside your browser with local JavaScript. There is no upload endpoint, no account system and no database storing your content — see the privacy page for the full detail.',
  },
  {
    q: 'Is there a size limit?',
    a: 'No artificial limit. Small inputs are processed instantly; larger inputs (over about 100 KB) are handed to a background Web Worker so the page stays responsive while the work happens.',
  },
  {
    q: 'Does it work on a phone?',
    a: 'Yes. The tools are built mobile-first: big touch targets, textareas that work with the native keyboard, and outputs you can copy straight into other apps.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Current versions of Chrome, Edge, Firefox and Safari. Nothing needs to be installed and no browser extension is required.',
  },
];
