import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, SensitiveDataFilter, MastraStorageExporter, MastraPlatformExporter } from '@mastra/observability';
import { pathToFileURL } from 'node:url';
import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { createTool, webSearchTool, askUserTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Workspace, WORKSPACE_TOOLS, LocalSandbox, LocalFilesystem } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';

"use strict";
const zenrowsFetchTool = createTool({
  id: "zenrows-fetch",
  description: "Fetches web pages using ZenRows. Use this tool when you need information from a specific URL. Set extractJson to true when you need structured data such as product details, pricing, availability, ratings, or other fields. Leave extractJson false when you need the page content as Markdown.",
  inputSchema: z.object({
    url: z.string().url(),
    extractJson: z.boolean().optional()
  }),
  outputSchema: z.object({
    content: z.union([z.string(), z.record(z.string(), z.unknown())]),
    statusCode: z.number(),
    url: z.string()
  }),
  execute: async ({ url, extractJson }) => {
    const zenrowsUrl = new URL("https://api.zenrows.com/v1/");
    zenrowsUrl.searchParams.set("url", url);
    zenrowsUrl.searchParams.set(
      "apikey",
      process.env.ZENROWS_API_KEY
    );
    zenrowsUrl.searchParams.set("mode", "auto");
    if (extractJson) {
      zenrowsUrl.searchParams.set("extract", "auto");
    } else {
      zenrowsUrl.searchParams.set("response_type", "markdown");
    }
    const response = await fetch(zenrowsUrl);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `ZenRows request failed with status ${response.status}: ${error}`
      );
    }
    if (extractJson) {
      const body = await response.json();
      return {
        content: body.parsed,
        statusCode: response.status,
        url
      };
    }
    const content = await response.text();
    return {
      content,
      statusCode: response.status,
      url
    };
  }
});

"use strict";
const startScheduleTool = createTool({
  id: "start_schedule",
  description: "Start a recurring schedule for the default agent.",
  inputSchema: z.object({
    schedule: z.string().describe("Cron expression for when to run."),
    prompt: z.string().describe("Prompt to run on the schedule.")
  }),
  execute: async ({ schedule, prompt }, { mastra, agent }) => {
    if (!agent?.threadId || !agent.resourceId) {
      throw new Error("A threadId and resourceId are required to create a schedule.");
    }
    return mastra.schedules.create({
      agentId: "agent",
      cron: schedule,
      prompt,
      threadId: agent.threadId,
      resourceId: agent.resourceId
    });
  }
});
const stopScheduleTool = createTool({
  id: "stop_schedule",
  description: "Stop a schedule by pausing it.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule id returned by start_schedule.")
  }),
  execute: async ({ scheduleId }, { mastra }) => mastra.schedules.pause(scheduleId)
});

"use strict";
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

"use strict";
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

"use strict";
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

export { mastra };
