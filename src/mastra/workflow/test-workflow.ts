import 'dotenv/config';
import { mastra } from '..';

const workflow = mastra.getWorkflow('productResearchWorkflow');

const run = await workflow.createRun();

const result = await run.start({
  inputData: {
    urls: [
      'https://www.walmart.com/search?q=tanktop',
      'https://www.walmart.com/search?q=shirts',
      'https://www.walmart.com/browse/home/shop-water-bottles/4044_623679_639999_7751805_4269055_2976621',
    ],
  },
});

console.log(JSON.stringify(result, null, 2));
