import needle from "needle";

// The code below sets the bearer token from your environment variables
// To set environment variables on Mac OS X, run the export command below from the terminal: 
// export BEARER_TOKEN='YOUR-TOKEN' 
const token: string = process.env.BEARER_TOKEN!;  

const streamURL: string = 'https://api.twitter.com/2/tweets/sample/stream';

function streamConnect(token: string, outputFn: (any: any) => void)
{

  const options = {
    timeout: 20000
  }

  const stream: NodeJS.ReadableStream = needle.get(streamURL, {
    headers: { 
      Authorization: `Bearer ${token}`
    }
  }, options);

  stream.on('data', data => {
    try {
      const json = JSON.parse(data);
      outputFn(json);
    } catch (e) {
      // Keep alive signal received. Do nothing.
    }
  }).on('error', error => {
    if (error.code === 'ETIMEDOUT') {
      stream.emit('timeout');
    }
  });

  return stream;
}

export async function stream(outputFn: (any: any) => void)
{
  // Listen to the stream.
  // This reconnection logic will attempt to reconnect when a disconnection is detected.
  // To avoid rate limites, this logic implements exponential backoff, so the wait time
  // will increase if the client cannot reconnect to the stream.
  
  const sampledStream = streamConnect(token, outputFn)
  let timeout = 0;
  sampledStream.on('timeout', () => {
    // Reconnect on error
    console.warn('A connection error occurred. Reconnecting…');
    setTimeout(() => {
      timeout++;
      streamConnect(token, outputFn);
    }, 2 ** timeout);
    streamConnect(token, outputFn);
  })
}