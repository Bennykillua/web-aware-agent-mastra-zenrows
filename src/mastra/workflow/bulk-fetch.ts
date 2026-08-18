import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { zenrowsFetchTool } from '../tools/zenrows-fetch';

const prepareUrlsStep = createStep({
  id: 'prepare-urls',

  inputSchema: z.object({
    urls: z.array(z.string().url()),
  }),

  outputSchema: z.array(
    z.object({
      url: z.string().url(),
    }),
  ),

  execute: async ({ inputData }) => {
    return inputData.urls.map(url => ({
      url,
    }));
  },
});

const fetchProductStep = createStep({
  id: 'fetch-product',

  inputSchema: z.object({
    url: z.string().url(),
  }),

  outputSchema: z.object({
    url: z.string(),
    content: z.record(z.string(), z.unknown()),
    statusCode: z.number(),
  }),

  execute: async ({ inputData }) => {
    const result = await zenrowsFetchTool.execute({
      url: inputData.url,
      extractJson: true,
    });

    return {
      url: inputData.url,
      // the tool returns a union, this workflow always extracts
      content: result.content as Record<string, unknown>,
      statusCode: result.statusCode,
    };
  },
});

export const productResearchWorkflow = createWorkflow({
  id: 'product-research-workflow',

  inputSchema: z.object({
    urls: z.array(z.string().url()),
  }),

  outputSchema: z.array(
    z.object({
      url: z.string(),
      content: z.record(z.string(), z.unknown()),
      statusCode: z.number(),
    }),
  ),
})
  .then(prepareUrlsStep)
  // concurrency controls how many urls run at once
  .foreach(fetchProductStep, { concurrency: 5 })
  .commit();