export {};

const url =
  'https://www.amazon.com/Owala-FreeSip-Stainless-Steel-Bottle/dp/B0GPSKQN1D/?th=1';

const zenrowsUrl = new URL('https://api.zenrows.com/v1/');

zenrowsUrl.searchParams.set('url', url);
zenrowsUrl.searchParams.set(
  'apikey',
  process.env.ZENROWS_API_KEY!,
);
zenrowsUrl.searchParams.set('mode', 'auto');
zenrowsUrl.searchParams.set('extract', 'auto');

const response = await fetch(zenrowsUrl);

console.log('status:', response.status);

const body = await response.json();

console.log('top-level keys:', Object.keys(body));

console.log('parsed:', JSON.stringify(body.parsed, null, 2));