# Web-Aware AI Agent with Mastra and Zenrows

A TypeScript market research agent built with Mastra that fetches live data from dynamic and protected websites using Zenrows. Includes a typed Zenrows tool, an agent that decides when to fetch, and a deterministic workflow for bulk URL processing.

## Features

- Custom Zenrows Fetch tool built with Mastra's `createTool` and Zod schemas
- Markdown output for agent reasoning, structured JSON output via `extract=auto`
- Market research agent with an explicit system prompt for reliable tool calling
- Deterministic workflow that processes a known URL list with configurable concurrency
- Typed input and output validation on every tool and workflow step
- Works with both OpenAI and Anthropic models via a one-line change

## Prerequisites

- Node.js 20 or later
- A Zenrows account and API key
- An OpenAI or Anthropic API key
- Familiarity with TypeScript and Mastra

Note: `extract=auto` is in private beta and enabled per domain. Requests to a domain that is not enabled on your account return a 402 with error code `AUTH010`.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/bennykillua/web-aware-agent-mastra-zenrows.git
cd web-aware-agent-mastra-zenrows
```

### 2. Install dependencies

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```
ZENROWS_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
```

Get your Zenrows API key from the [Zenrows dashboard](https://www.zenrows.com/register). Use `ANTHROPIC_API_KEY` instead if you switch the agent to an Anthropic model.

## Project structure

```
.
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── agent.ts
│       │   └── market-research-agent.ts
│       ├── tools/
│       │   ├── schedule-tools.ts
│       │   ├── test-agent.ts
│       │   ├── test-tool-extend-extract.ts
│       │   ├── test-tool.ts
│       │   └── zenrows-fetch.ts
│       ├── workflow/
│       │   ├── bulk-fetch.ts
│       │   └── test-workflow.ts
│       └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

The files this article covers are `zenrows-fetch.ts`, `market-research-agent.ts`, and `bulk-fetch.ts`. `index.ts` registers them with the Mastra runtime. The `test-*.ts` files are the scripts used to run each piece directly: `test-tool.ts` for the Markdown path, `test-tool-extend-extract.ts` for structured extraction, `test-agent.ts` for the agent, and `test-workflow.ts` for the bulk run. Other files in the repository are unrelated to the tutorial.

## How it works

The tool wraps the Zenrows Fetch API and returns either Markdown or parsed JSON depending on the `extractJson` flag. The agent reads the tool description and decides which it needs. The workflow skips the model entirely and always extracts.

```
URL
  ↓
zenrows-fetch tool (mode=auto)
  ↓
Markdown  or  extract=auto JSON
  ↓
Agent reasoning  or  Workflow array output
```

## Running the project

### Test the tool directly

Markdown output:

```bash
npx tsx src/mastra/tools/test-tool.ts
```

Structured JSON output:

```bash
npx tsx src/mastra/tools/test-tool-extend-extract.ts
```

### Run the agent

```bash
npx tsx src/mastra/tools/test-agent.ts
```

### Run the bulk workflow

```bash
npx tsx src/mastra/workflow/test-workflow.ts
```

## Output

The tool test prints a status code and the page as Markdown, or a parsed product object when `extractJson` is true.

The agent test prints the tool call it made, including the arguments it chose, followed by a comparison table built from the fetched data.

The workflow test prints an array of results in the same order as the input URLs, each with the source URL, the parsed content, and a status code.

Field names in extracted output vary by page type. Search pages and browse pages on the same site can return different keys, so check what your target actually returns before depending on a specific field.

## Technologies

- TypeScript
- Mastra
- Zenrows
- Zod
- OpenAI

## Troubleshooting

**402 with `AUTH010`** — `extract=auto` is not enabled for that domain on your account. Contact Zenrows support to request access, or use the Markdown path instead.

**401 from Zenrows** — `ZENROWS_API_KEY` is missing from `.env`. The tool sends the value as-is, so an unset variable reaches the API as an invalid key.

**429 during workflow runs** — lower the `concurrency` value on the `.foreach` call to stay within your plan's limit.

**`getWorkflow` returns undefined** — the workflow is not registered in `src/mastra/index.ts`, or the key does not match the name passed to `getWorkflow`.

## Related article

This repository accompanies the Zenrows article:

**[Article title]**

[ARTICLE_URL]