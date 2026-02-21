import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import { fetchChartData } from "@/lib/api";

interface StockChartProps {
  symbol: string;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "D", "W", "M"];

// Generate realistic demo OHLCV data
function generateDemoData(symbol: string, count = 200): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const basePrices: Record<string, number> = {
    BBCA: 9800, BBRI: 4600, TLKM: 3400, ASII: 5200, BMRI: 6300,
    UNVR: 3150, GOTO: 72, BREN: 6900, ADRO: 2700, ANTM: 1530,
    PGAS: 1350, INDF: 6700,
  };
  let price = basePrices[symbol] || 5000;
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 86400;

  for (let i = count; i >= 0; i--) {
    const time = (now - i * daySeconds) as Time;
    const volatility = price * 0.025;
    const open = price + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    data.push({ time, open, high, low, close });
    price = close;
  }
  return data;
}

export default function StockChart({ symbol }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [timeframe, setTimeframe] = useState("D");
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "hsl(220, 20%, 10%)" },
        textColor: "hsl(210, 20%, 55%)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(220, 13%, 16%)" },
        horzLines: { color: "hsl(220, 13%, 16%)" },
      },
      crosshair: {
        vertLine: { color: "hsl(210, 20%, 40%)", width: 1, style: 2 },
        horzLine: { color: "hsl(210, 20%, 40%)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "hsl(220, 13%, 20%)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "hsl(220, 13%, 20%)",
        timeVisible: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 71%, 45%)",
      downColor: "hsl(0, 84%, 60%)",
      borderUpColor: "hsl(142, 71%, 45%)",
      borderDownColor: "hsl(0, 84%, 60%)",
      wickUpColor: "hsl(142, 71%, 45%)",
      wickDownColor: "hsl(0, 84%, 60%)",
    });

    chartInstance.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [symbol, timeframe]);

  async function loadData() {
    if (!seriesRef.current) return;
    setLoading(true);
    setUsingDemo(false);

    try {
      const result = await fetchChartData(symbol, timeframe);

      // Try to parse API response
      if (result && Array.isArray(result) && result.length > 0 && result[0].open !== undefined) {
        const candles: CandlestickData<Time>[] = result.map((item: any) => ({
          time: (typeof item.time === 'number' ? item.time : Math.floor(new Date(item.time || item.date || item.timestamp).getTime() / 1000)) as Time,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        }));
        seriesRef.current.setData(candles);
        chartInstance.current?.timeScale().fitContent();
      } else if (result && result.data && Array.isArray(result.data)) {
        const candles: CandlestickData<Time>[] = result.data.map((item: any) => ({
          time: (typeof item.time === 'number' ? item.time : Math.floor(new Date(item.time || item.date || item.timestamp).getTime() / 1000)) as Time,
          open: Number(item.open || item.o),
          high: Number(item.high || item.h),
          low: Number(item.low || item.l),
          close: Number(item.close || item.c),
        }));
        seriesRef.current.setData(candles);
        chartInstance.current?.timeScale().fitContent();
      } else {
        throw new Error("Unexpected data format");
      }
    } catch (err) {
      console.warn("Using demo data for", symbol, err);
      setUsingDemo(true);
      const demoData = generateDemoData(symbol);
      seriesRef.current.setData(demoData);
      chartInstance.current?.timeScale().fitContent();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground mr-3">
          IDX:{symbol}
        </span>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {tf}
          </button>
        ))}
        {loading && (
          <span className="ml-2 text-xs text-muted-foreground animate-pulse">Loading...</span>
        )}
        {usingDemo && (
          <span className="ml-2 text-xs text-warning">Demo data</span>
        )}
      </div>
      <div ref={chartRef} className="flex-1" />
    </div>
  );
}
