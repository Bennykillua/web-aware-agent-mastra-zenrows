import 'dotenv/config';
import { zenrowsFetchTool } from './zenrows-fetch';

if (!zenrowsFetchTool.execute) {
  throw new Error('ZenRows tool does not have an execute function');
}


const result = await zenrowsFetchTool.execute(
  {
    url: 'https://www.walmart.com/search?q=bike',
    extractJson: true,
  },
  {} as any,
);

if (!result || 'statusCode' in result === false) {
  throw new Error('ZenRows tool returned an unexpected result');
}

console.log(result.statusCode);
console.log(
  typeof result.content === 'string'
    ? result.content.slice(0, 300)
    : result.content
);
