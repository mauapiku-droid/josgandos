import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine host and build URL based on endpoint type
    let host: string;
    let baseUrl: string;

    if (endpoint.startsWith('/stock-data') || endpoint.startsWith('/trading')) {
      host = 'indonesia-stock-exchange-idx.p.rapidapi.com';
      baseUrl = `https://${host}${endpoint}`;
    } else {
      host = 'marketflow-all-in-one-market-finance-api.p.rapidapi.com';
      baseUrl = `https://${host}${endpoint}`;
    }

    // Build query string
    const url = new URL(baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    console.log(`Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': rapidApiKey,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
