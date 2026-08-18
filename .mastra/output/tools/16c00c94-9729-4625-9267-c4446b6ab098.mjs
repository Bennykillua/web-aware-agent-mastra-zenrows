import { m as mastra } from '../index3.mjs';
import '@mastra/core/mastra';
import '@mastra/libsql';
import '@mastra/duckdb';
import '@mastra/core/storage';
import '@mastra/observability';
import 'node:url';
import '@mastra/core/agent';
import '@mastra/core/signals';
import '@mastra/core/tools';
import './3e3269c7-1b11-4061-ac77-4fd3b5bf742b.mjs';
import 'zod';
import '@mastra/core/workspace';
import '@mastra/memory';
import './56feeb25-150c-4821-8577-1ac23e7aaf4a.mjs';

const agent = mastra.getAgent("marketResearchAgent");
const result = await agent.generate(
  "Compare the bikes on https://www.walmart.com/search?q=bike. Give me the five cheapest with their ratings, and flag any that are sponsored."
);
console.log(JSON.stringify(result.toolCalls, null, 2));
console.log(result.text);
