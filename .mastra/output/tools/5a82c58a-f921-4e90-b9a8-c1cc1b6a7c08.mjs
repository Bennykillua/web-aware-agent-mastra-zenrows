import { zenrowsFetchTool } from './3e3269c7-1b11-4061-ac77-4fd3b5bf742b.mjs';
import '@mastra/core/tools';
import 'zod';

const result = await zenrowsFetchTool.execute({
  url: "https://www.walmart.com/search?q=bike",
  extractJson: true
});
console.log(result.statusCode);
console.log(JSON.stringify(result.content, null, 2));
