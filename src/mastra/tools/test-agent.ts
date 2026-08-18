import 'dotenv/config';
import { mastra } from '..';

const agent = mastra.getAgent('marketResearchAgent');

const result = await agent.generate(
  'Compare the bikes on https://www.walmart.com/search?q=bike. Give me the five cheapest with their ratings, and flag any that are sponsored.',
);

console.log(JSON.stringify(result.toolCalls, null, 2));
console.log(result.text);