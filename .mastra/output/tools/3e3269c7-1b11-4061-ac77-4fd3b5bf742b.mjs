import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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

export { zenrowsFetchTool };
