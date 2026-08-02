// api/chat.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    const response = await fetch('https://api.tokenrouter.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify(body)
    });

    // If the upstream API returns an error, capture the exact message
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Upstream API Error ${response.status}: ${errorText}` }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ONLY pass the stream if the upstream API actually supports it
    if (body.stream && response.headers.get('Content-Type')?.includes('text/event-stream')) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Otherwise, return the standard complete JSON response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


