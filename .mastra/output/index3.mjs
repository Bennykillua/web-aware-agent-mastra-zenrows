import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, SensitiveDataFilter, MastraStorageExporter, MastraPlatformExporter } from '@mastra/observability';
import { pathToFileURL } from 'node:url';
import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { webSearchTool, askUserTool } from '@mastra/core/tools';
import { zenrowsFetchTool } from './tools/3e3269c7-1b11-4061-ac77-4fd3b5bf742b.mjs';
import { Workspace, LocalSandbox, LocalFilesystem, WORKSPACE_TOOLS } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { stopScheduleTool, startScheduleTool } from './tools/56feeb25-150c-4821-8577-1ac23e7aaf4a.mjs';

const workspacePath = "workspace";
const workspace = new Workspace({
  id: "agent-workspace",
  name: "Agent Workspace",
  filesystem: new LocalFilesystem({
    basePath: workspacePath
  }),
  sandbox: new LocalSandbox({
    workingDirectory: workspacePath
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireReadBeforeWrite: true
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireReadBeforeWrite: true
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true
    }
  }
});
const agent = new Agent({
  id: "agent",
  name: "Agent",
  description: "A general-purpose assistant that can research, manage tasks, work with local files, run approved commands, and create recurring schedules.",
  metadata: {
    suggestedPrompts: [
      "What's the weather in Austin this weekend?",
      "What's the SPCX stock price right now?",
      "Build a Japanese sakura festival landing page."
    ]
  },
  instructions: `You are a friendly starter agent for exploring what Mastra can do. Help the user try useful capabilities, build small projects, answer current questions, and shape this harness into a starting point for future work.

Suggested prompts: Get the weather forecast for your city; Create a Japanese Sakura festival page; Tell me the SPCX stock price now, then every minute.

When the user greets you or does not have a specific task, invite them to try the suggested prompts.

Ask concise questions when something is unclear or a good question could surface a useful insight.

For local file changes, end with a plain-text URL using ${pathToFileURL(`${workspacePath}/`).href}; avoid Markdown links, localhost, /workspace, relative paths, and static-file servers.
`,
  model: "openai/gpt-5.6-terra",
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true
  },
  memory: new Memory({
    options: {
      generateTitle: true,
      observationalMemory: {
        model: "openai/gpt-5-mini"
      }
    }
  }),
  workspace,
  tools: {
    ask_user: askUserTool,
    start_schedule: startScheduleTool,
    stop_schedule: stopScheduleTool,
    zenrows_fetch: zenrowsFetchTool,
    web_search: webSearchTool
  },
  signals: [new TaskSignalProvider()]
});

const marketResearchAgent = new Agent({
  id: "market-research-agent",
  name: "Market Research Agent",
  description: "An agent that researches and compares products using live web data.",
  instructions: `
You are a product market research agent.

Your job is to research and compare products using the zenrows_fetch tool.

When the user provides one or more product URLs:

1. Fetch each URL using zenrows_fetch.
2. When product information such as name, price, availability, or rating is needed, use structured extraction.
3. Extract the relevant product information from each result.
4. Never invent or assume information that was not returned by the tool.
5. If information is missing, clearly state that it is unavailable.
6. Preserve the currency returned by the source.
7. Do not directly compare prices when the products use different currencies unless a reliable currency conversion is available.
8. When comparing products, present the results clearly in a table when appropriate.
9. After presenting the data, provide useful observations based only on the retrieved information.

Do not use web search when the user asks you to use zenrows_fetch only.
`,
  model: "openai/gpt-5.6-terra",
  tools: {
    zenrows_fetch: zenrowsFetchTool
  }
});

const mastra = new Mastra({
  bundler: {
    externals: ["@duckdb/node-bindings"]
  },
  agents: {
    agent,
    marketResearchAgent
  },
  tools: {
    startScheduleTool,
    stopScheduleTool
  },
  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: new LibSQLStore({
      id: "mastra-storage",
      url: process.env.TURSO_DATABASE_URL || "file:./mastra.db",
      authToken: process.env.TURSO_AUTH_TOKEN || void 0
    }),
    domains: {
      observability: await new DuckDBStore().getStore("observability")
    }
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()]
      }
    }
  })
});

export { mastra as m };
