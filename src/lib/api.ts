import { supabase } from "@/integrations/supabase/client";

interface ProxyParams {
  endpoint: string;
  params?: Record<string, string | number>;
}

export async function fetchIDXData({ endpoint, params }: ProxyParams) {
  const { data, error } = await supabase.functions.invoke('idx-proxy', {
    body: { endpoint, params },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchConstituents() {
  return fetchIDXData({ endpoint: '/stock-data/constituents' });
}

export async function fetchStockSummary(symbol: string) {
  return fetchIDXData({
    endpoint: '/trading/summary',
    params: { symbol },
  });
}

// Map UI timeframe labels to API values
const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  'D': 'D',
  'W': 'W',
  'M': 'M',
};

export async function fetchChartData(symbol: string, timeframe = 'D', range = 300) {
  const marketSymbol = symbol.includes(':') ? symbol : `IDX:${symbol}`;
  const apiTimeframe = TIMEFRAME_MAP[timeframe] || timeframe;
  return fetchIDXData({
    endpoint: '/v2/chart/price',
    params: {
      symbol: marketSymbol,
      timeframe: apiTimeframe,
      range,
    },
  });
}

export async function searchSymbol(query: string) {
  return fetchIDXData({
    endpoint: '/v2/search/market',
    params: { query },
  });
}
