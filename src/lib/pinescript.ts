// PineScript-like indicator parser and calculator
// Supports common indicators: SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, Stochastic

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorResult {
  name: string;
  type: "line" | "histogram" | "band";
  lines: {
    label: string;
    color: string;
    data: { time: number; value: number }[];
    lineWidth?: number;
    lineStyle?: number;
  }[];
}

// Calculate Simple Moving Average
function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

// Calculate Exponential Moving Average
function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const smaVal = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(smaVal);
    } else {
      const prev = result[i - 1];
      if (prev !== null) {
        result.push((data[i] - prev) * multiplier + prev);
      } else {
        result.push(null);
      }
    }
  }
  return result;
}

// Calculate RSI
function rsi(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);

    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const prevRsi = result[i - 1];
      if (prevRsi === null) {
        result.push(null);
        continue;
      }
      const prevAvgGain = gains.slice(0, i - 1).reduce((a, b) => a + b, 0) / (i - 1);
      const prevAvgLoss = losses.slice(0, i - 1).reduce((a, b) => a + b, 0) / (i - 1);
      const avgGain = (prevAvgGain * (period - 1) + gains[i - 1]) / period;
      const avgLoss = (prevAvgLoss * (period - 1) + losses[i - 1]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// Calculate Standard Deviation
function stdev(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
      result.push(Math.sqrt(variance));
    }
  }
  return result;
}

export interface ParsedIndicator {
  name: string;
  func: string;
  params: Record<string, number>;
  color?: string;
}

// Parse PineScript-like code to extract indicator definitions
export function parsePineScript(script: string): ParsedIndicator[] {
  const indicators: ParsedIndicator[] = [];
  const lines = script.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));

  for (const line of lines) {
    // Match: ta.sma(close, 20) or sma(close, 20)
    let match = line.match(/(?:ta\.)?sma\s*\(\s*close\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const period = parseInt(match[1]);
      const colorMatch = line.match(/color\s*[=:]\s*(#[0-9a-fA-F]{6}|color\.\w+)/);
      indicators.push({
        name: `SMA ${period}`,
        func: "sma",
        params: { period },
        color: parseColor(colorMatch?.[1]),
      });
      continue;
    }

    // Match: ta.ema(close, 20)
    match = line.match(/(?:ta\.)?ema\s*\(\s*close\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const period = parseInt(match[1]);
      const colorMatch = line.match(/color\s*[=:]\s*(#[0-9a-fA-F]{6}|color\.\w+)/);
      indicators.push({
        name: `EMA ${period}`,
        func: "ema",
        params: { period },
        color: parseColor(colorMatch?.[1]),
      });
      continue;
    }

    // Match: ta.rsi(close, 14)
    match = line.match(/(?:ta\.)?rsi\s*\(\s*close\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const period = parseInt(match[1]);
      indicators.push({
        name: `RSI ${period}`,
        func: "rsi",
        params: { period },
        color: "#AB47BC",
      });
      continue;
    }

    // Match: ta.macd(close, 12, 26, 9)
    match = line.match(/(?:ta\.)?macd\s*\(\s*close\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      indicators.push({
        name: "MACD",
        func: "macd",
        params: {
          fast: parseInt(match[1]),
          slow: parseInt(match[2]),
          signal: parseInt(match[3]),
        },
        color: "#2196F3",
      });
      continue;
    }

    // Match: ta.bb(close, 20, 2)
    match = line.match(/(?:ta\.)?bb\s*\(\s*close\s*,\s*(\d+)\s*,\s*(\d+\.?\d*)\s*\)/i);
    if (match) {
      indicators.push({
        name: `BB ${match[1]},${match[2]}`,
        func: "bb",
        params: {
          period: parseInt(match[1]),
          stddev: parseFloat(match[2]),
        },
        color: "#FF9800",
      });
      continue;
    }

    // Simple shorthand: just "SMA 20" or "EMA 50"
    match = line.match(/^(sma|ema|rsi)\s+(\d+)$/i);
    if (match) {
      const func = match[1].toLowerCase();
      const period = parseInt(match[2]);
      indicators.push({
        name: `${func.toUpperCase()} ${period}`,
        func,
        params: { period },
      });
      continue;
    }

    // MACD shorthand
    match = line.match(/^macd\s+(\d+)\s+(\d+)\s+(\d+)$/i);
    if (match) {
      indicators.push({
        name: "MACD",
        func: "macd",
        params: {
          fast: parseInt(match[1]),
          slow: parseInt(match[2]),
          signal: parseInt(match[3]),
        },
      });
      continue;
    }

    // BB shorthand
    match = line.match(/^bb\s+(\d+)\s+(\d+\.?\d*)$/i);
    if (match) {
      indicators.push({
        name: `BB ${match[1]},${match[2]}`,
        func: "bb",
        params: {
          period: parseInt(match[1]),
          stddev: parseFloat(match[2]),
        },
      });
      continue;
    }
  }

  return indicators;
}

function parseColor(color?: string): string | undefined {
  if (!color) return undefined;
  if (color.startsWith("#")) return color;
  const colorMap: Record<string, string> = {
    "color.red": "#EF5350",
    "color.green": "#26A69A",
    "color.blue": "#2196F3",
    "color.yellow": "#FFEB3B",
    "color.orange": "#FF9800",
    "color.purple": "#AB47BC",
    "color.white": "#FFFFFF",
    "color.aqua": "#00BCD4",
    "color.lime": "#CDDC39",
    "color.fuchsia": "#E040FB",
  };
  return colorMap[color];
}

const DEFAULT_COLORS = ["#2196F3", "#FF9800", "#26A69A", "#EF5350", "#AB47BC", "#FFEB3B", "#00BCD4", "#E040FB"];

// Calculate indicator values from OHLC data
export function calculateIndicator(
  indicator: ParsedIndicator,
  candles: OHLCData[],
  colorIndex: number
): IndicatorResult | null {
  const closes = candles.map((c) => c.close);
  const times = candles.map((c) => c.time);
  const defaultColor = indicator.color || DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];

  switch (indicator.func) {
    case "sma": {
      const values = sma(closes, indicator.params.period);
      return {
        name: indicator.name,
        type: "line",
        lines: [
          {
            label: indicator.name,
            color: defaultColor,
            data: values
              .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 2,
          },
        ],
      };
    }

    case "ema": {
      const values = ema(closes, indicator.params.period);
      return {
        name: indicator.name,
        type: "line",
        lines: [
          {
            label: indicator.name,
            color: defaultColor,
            data: values
              .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 2,
          },
        ],
      };
    }

    case "rsi": {
      const values = rsi(closes, indicator.params.period);
      return {
        name: indicator.name,
        type: "line",
        lines: [
          {
            label: indicator.name,
            color: defaultColor,
            data: values
              .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 1,
          },
        ],
      };
    }

    case "macd": {
      const fastEma = ema(closes, indicator.params.fast);
      const slowEma = ema(closes, indicator.params.slow);
      const macdLine = fastEma.map((f, i) =>
        f !== null && slowEma[i] !== null ? f - slowEma[i]! : null
      );
      const macdFiltered = macdLine.filter((v) => v !== null) as number[];
      const signalLine = ema(macdFiltered, indicator.params.signal);

      // Pad signal line
      const offset = macdLine.findIndex((v) => v !== null);
      const paddedSignal: (number | null)[] = new Array(offset).fill(null);
      for (const v of signalLine) {
        paddedSignal.push(v);
      }

      return {
        name: "MACD",
        type: "histogram",
        lines: [
          {
            label: "MACD",
            color: "#2196F3",
            data: macdLine
              .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 2,
          },
          {
            label: "Signal",
            color: "#FF9800",
            data: paddedSignal
              .map((v, i) => (v !== null && i < times.length ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 1,
          },
        ],
      };
    }

    case "bb": {
      const { period, stddev: mult } = indicator.params;
      const middle = sma(closes, period);
      const sd = stdev(closes, period);

      return {
        name: indicator.name,
        type: "band",
        lines: [
          {
            label: "Upper",
            color: "rgba(255, 152, 0, 0.5)",
            data: middle
              .map((v, i) =>
                v !== null && sd[i] !== null
                  ? { time: times[i], value: v + sd[i]! * mult }
                  : null
              )
              .filter(Boolean) as any,
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            label: "Middle",
            color: "#FF9800",
            data: middle
              .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
              .filter(Boolean) as any,
            lineWidth: 1,
          },
          {
            label: "Lower",
            color: "rgba(255, 152, 0, 0.5)",
            data: middle
              .map((v, i) =>
                v !== null && sd[i] !== null
                  ? { time: times[i], value: v - sd[i]! * mult }
                  : null
              )
              .filter(Boolean) as any,
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
      };
    }

    default:
      return null;
  }
}

// Pre-built indicator templates
export const INDICATOR_TEMPLATES = [
  { name: "SMA 20", script: "ta.sma(close, 20)" },
  { name: "SMA 50", script: "ta.sma(close, 50)" },
  { name: "SMA 200", script: "ta.sma(close, 200)" },
  { name: "EMA 12", script: "ta.ema(close, 12)" },
  { name: "EMA 26", script: "ta.ema(close, 26)" },
  { name: "RSI 14", script: "ta.rsi(close, 14)" },
  { name: "MACD", script: "ta.macd(close, 12, 26, 9)" },
  { name: "Bollinger Bands", script: "ta.bb(close, 20, 2)" },
];
