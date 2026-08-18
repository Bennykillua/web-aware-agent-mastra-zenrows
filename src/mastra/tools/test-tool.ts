import 'dotenv/config';
import { zenrowsFetchTool } from './zenrows-fetch';

const result = await zenrowsFetchTool.execute({
  url: 'https://www.walmart.com/search?q=bike',
});

console.log(result.statusCode);
console.log(result.content.slice(0, 300));