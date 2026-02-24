import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, LineSeries, SeriesMarker, createSeriesMarkers, ISeriesMarkersPluginApi } from "lightweight-charts";
import { fetchChartData } from "@/lib/api";
import { parsePineScript, calculateIndicator, OHLCData } from "@/lib/pinescript";
import { parseMLParams, calculateMLLogReg, MLSignal } from "@/lib/ml-logistic-regression";
import { parseML2or3, calculateML2, calculateML3, ML3Signal } from "@/lib/ml-linear-regression";
import IndicatorPanel from "@/components/IndicatorPanel";

interface StockChartProps {
  symbol: string;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "D", "W", "M"];

function generateDemoData(symbol: string, count = 200): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const basePrices: Record<string, number> = {
    BBCA: 7200, BBRI: 4600, TLKM: 3400, ASII: 5200, BMRI: 6300,
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

function signalsToMarkers(signals: MLSignal[]): SeriesMarker<Time>[] {
  return signals.map((s) => {
    if (s.type === "buy") {
      return {
        time: s.time as Time,
        position: "belowBar" as const,
        color: "#00BCD4",
        shape: "arrowUp" as const,
        text: "Buy",
      };
    } else if (s.type === "sell") {
      return {
        time: s.time as Time,
        position: "aboveBar" as const,
        color: "#FF0080",
        shape: "arrowDown" as const,
        text: "Sell",
      };
    } else if (s.type === "stopBuy") {
      return {
        time: s.time as Time,
        position: "aboveBar" as const,
        color: "rgba(0,188,212,0.5)",
        shape: "circle" as const,
        text: "×",
      };
    } else {
      return {
        time: s.time as Time,
        position: "belowBar" as const,
        color: "rgba(255,0,128,0.5)",
        shape: "circle" as const,
        text: "×",
      };
    }
  });
}

export default function StockChart({ symbol }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const [timeframe, setTimeframe] = useState("D");
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [scripts, setScripts] = useState<string[]>([]);
  const [activeIndicatorNames, setActiveIndicatorNames] = useState<string[]>([]);
  const candlesRef = useRef<OHLCData[]>([]);
  const [hoverData, setHoverData] = useState<{
    open: number; high: number; low: number; close: number; volume?: number; time: string;
  } | null>(null);

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

    // Crosshair move handler for OHLCV display
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const data = param.seriesData.get(series) as any;
      if (data && data.open !== undefined) {
        // Find matching candle for volume
        const timeVal = param.time as number;
        const candle = candlesRef.current.find((c) => c.time === timeVal);
        const date = new Date(timeVal * 1000);
        const timeStr = date.toLocaleDateString("id-ID", {
          day: "2-digit", month: "short", year: "numeric",
        });
        setHoverData({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: candle?.volume,
          time: timeStr,
        });
      } else {
        setHoverData(null);
      }
    });

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
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [symbol, timeframe]);

  useEffect(() => {
    applyIndicators();
  }, [scripts]);

  const removeIndicatorSeries = useCallback(() => {
    if (!chartInstance.current) return;
    for (const s of indicatorSeriesRef.current) {
      try {
        chartInstance.current.removeSeries(s);
      } catch {}
    }
    indicatorSeriesRef.current = [];
  }, []);

  const applyIndicators = useCallback(() => {
    if (!chartInstance.current || candlesRef.current.length === 0) return;

    removeIndicatorSeries();

    // Clear existing markers
    if (markersPluginRef.current) {
      markersPluginRef.current.detach();
      markersPluginRef.current = null;
    }

    const allNames: string[] = [];
    let colorIdx = 0;
    let allMarkers: SeriesMarker<Time>[] = [];

    for (const script of scripts) {
      // Check ML2 / ML3
      const ml2or3 = parseML2or3(script);
      if (ml2or3) {
        if (ml2or3.type === "ml2") {
          const result = calculateML2(candlesRef.current, ml2or3.params);
          if (result) {
            allNames.push(result.name);
            for (const line of result.lines) {
              const lineSeries = chartInstance.current!.addSeries(LineSeries, {
                color: line.color,
                lineWidth: (line.lineWidth || 2) as any,
                lineStyle: line.lineStyle,
                priceLineVisible: false,
                lastValueVisible: true,
                title: line.label,
              });
              lineSeries.setData(line.data.map((d) => ({ time: d.time as Time, value: d.value })));
              indicatorSeriesRef.current.push(lineSeries);
            }
          }
        } else {
          const { indicators } = calculateML3(candlesRef.current, ml2or3.params);
          if (indicators) {
            allNames.push(indicators.name);
            for (const line of indicators.lines) {
              const lineSeries = chartInstance.current!.addSeries(LineSeries, {
                color: line.color,
                lineWidth: (line.lineWidth || 2) as any,
                lineStyle: line.lineStyle,
                priceLineVisible: false,
                lastValueVisible: true,
                title: line.label,
              });
              lineSeries.setData(line.data.map((d) => ({ time: d.time as Time, value: d.value })));
              indicatorSeriesRef.current.push(lineSeries);
            }
          }
        }
        colorIdx++;
        continue;
      }

      // Check if this is an ML Logistic Regression script
      const mlParams = parseMLParams(script);
      if (mlParams !== null) {
        const { indicators, signals } = calculateMLLogReg(candlesRef.current, mlParams);
        if (indicators) {
          allNames.push(indicators.name);
          for (const line of indicators.lines) {
            const lineSeries = chartInstance.current!.addSeries(LineSeries, {
              color: line.color,
              lineWidth: (line.lineWidth || 2) as any,
              lineStyle: line.lineStyle,
              priceLineVisible: false,
              lastValueVisible: true,
              title: line.label,
            });
            lineSeries.setData(line.data.map((d) => ({ time: d.time as Time, value: d.value })));
            indicatorSeriesRef.current.push(lineSeries);
          }
        }
        if (signals.length > 0) {
          allMarkers = allMarkers.concat(signalsToMarkers(signals));
        }
        colorIdx++;
        continue;
      }

      // Standard indicators
      const parsed = parsePineScript(script);
      for (const ind of parsed) {
        const result = calculateIndicator(ind, candlesRef.current, colorIdx);
        if (!result) continue;
        allNames.push(result.name);

        for (const line of result.lines) {
          const lineSeries = chartInstance.current!.addSeries(LineSeries, {
            color: line.color,
            lineWidth: (line.lineWidth || 2) as any,
            lineStyle: line.lineStyle,
            priceLineVisible: false,
            lastValueVisible: true,
            title: line.label,
          });
          lineSeries.setData(line.data.map((d) => ({ time: d.time as Time, value: d.value })));
          indicatorSeriesRef.current.push(lineSeries);
        }
        colorIdx++;
      }
    }

    // Apply all markers to the candlestick series
    if (seriesRef.current && allMarkers.length > 0) {
      allMarkers.sort((a, b) => (a.time as number) - (b.time as number));
      markersPluginRef.current = createSeriesMarkers(seriesRef.current, allMarkers);
    }

    setActiveIndicatorNames(allNames);
  }, [scripts, removeIndicatorSeries]);

  async function loadData() {
    if (!seriesRef.current) return;
    setLoading(true);
    setUsingDemo(false);

    try {
      const result = await fetchChartData(symbol, timeframe);

      if (result?.success && result.data && Array.isArray(result.data)) {
        const candles: CandlestickData<Time>[] = result.data
          .sort((a: any, b: any) => a.time - b.time)
          .map((item: any) => ({
            time: item.time as Time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          }));
        
        candlesRef.current = result.data.sort((a: any, b: any) => a.time - b.time).map((item: any) => ({
          time: item.time,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume || 0),
        }));

        seriesRef.current.setData(candles);
        chartInstance.current?.timeScale().fitContent();
        applyIndicators();
      } else if (result && Array.isArray(result) && result.length > 0) {
        const sorted = result.sort((a: any, b: any) => (a.time || 0) - (b.time || 0));
        const candles: CandlestickData<Time>[] = sorted.map((item: any) => ({
          time: (typeof item.time === "number" ? item.time : Math.floor(new Date(item.time || item.date).getTime() / 1000)) as Time,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        }));
        candlesRef.current = sorted.map((item: any) => ({
          time: typeof item.time === "number" ? item.time : Math.floor(new Date(item.time || item.date).getTime() / 1000),
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume || 0),
        }));
        seriesRef.current.setData(candles);
        chartInstance.current?.timeScale().fitContent();
        applyIndicators();
      } else {
        throw new Error("Unexpected data format");
      }
    } catch (err) {
      console.warn("Using demo data for", symbol, err);
      setUsingDemo(true);
      const demoData = generateDemoData(symbol);
      candlesRef.current = demoData.map((d) => ({
        time: d.time as number,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      seriesRef.current.setData(demoData);
      chartInstance.current?.timeScale().fitContent();
      applyIndicators();
    } finally {
      setLoading(false);
    }
  }

  const handleAddScript = (script: string) => {
    setScripts((prev) => [...prev, script]);
  };

  const handleRemoveScript = (index: number) => {
    setScripts((prev) => prev.filter((_, i) => i !== index));
  };

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
      <IndicatorPanel
        scripts={scripts}
        onAddScript={handleAddScript}
        onRemoveScript={handleRemoveScript}
        activeIndicators={activeIndicatorNames}
      />
      <div className="relative flex-1">
        {hoverData && (
          <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-xs font-mono pointer-events-none">
            <span className="text-muted-foreground">{hoverData.time}</span>
            <span className="text-muted-foreground">O: <span className={hoverData.close >= hoverData.open ? "text-gain" : "text-loss"}>{hoverData.open.toLocaleString()}</span></span>
            <span className="text-muted-foreground">H: <span className="text-gain">{hoverData.high.toLocaleString()}</span></span>
            <span className="text-muted-foreground">L: <span className="text-loss">{hoverData.low.toLocaleString()}</span></span>
            <span className="text-muted-foreground">C: <span className={hoverData.close >= hoverData.open ? "text-gain" : "text-loss"}>{hoverData.close.toLocaleString()}</span></span>
            {hoverData.volume !== undefined && (
              <span className="text-muted-foreground">Vol: <span className="text-foreground">{hoverData.volume.toLocaleString()}</span></span>
            )}
          </div>
        )}
        <div ref={chartRef} className="w-full h-full" />
      </div>
    </div>
  );
}
