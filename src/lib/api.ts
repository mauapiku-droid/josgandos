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

export async function fetchChartData(symbol: string, timeframe = 'D', range = 300) {
  // Use MarketFlow v2 chart price endpoint
  // Symbol format for IDX: IDX:BBCA
  const marketSymbol = symbol.includes(':') ? symbol : `IDX:${symbol}`;
  return fetchIDXData({
    endpoint: '/v2/chart/price',
    params: {
      symbol: marketSymbol,
      timeframe,
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
