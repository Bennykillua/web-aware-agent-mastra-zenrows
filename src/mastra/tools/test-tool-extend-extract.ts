import 'dotenv/config';
import { zenrowsFetchTool } from './zenrows-fetch';

const result = await zenrowsFetchTool.execute({
  url: 'https://www.walmart.com/search?q=bike',
  extractJson: true,
});

console.log(result.statusCode);
console.log(JSON.stringify(result.content, null, 2));