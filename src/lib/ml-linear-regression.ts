// ML2: Linear Regression Line with EMA 20
// ML3: Improved Linear Regression Bull and Bear Power v02
// TypeScript implementations of TradingView PineScript indicators

import { OHLCData, IndicatorResult } from "./pinescript";

// ============ Math Helpers ============

function sma(data: number[], period: number, end: number): number {
  let sum = 0, count = 0;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    sum += data[end - i];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function ema(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  const k = 2 / (period + 1);
  result[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function stdev(data: number[], period: number, end: number): number {
  const mean = sma(data, period, end);
  let sumSq = 0, count = 0;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    const diff = data[end - i] - mean;
    sumSq += diff * diff;
    count++;
  }
  return count > 1 ? Math.sqrt(sumSq / count) : 0;
}

function correlation(x: number[], y: number[], period: number, end: number): number {
  const n = Math.min(period, end + 1);
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[end - i];
    const yi = y[end - i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function highest(data: number[], end: number, period: number): number {
  let max = -Infinity;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    max = Math.max(max, data[end - i]);
  }
  return max;
}

function highestBars(data: number[], end: number, period: number): number {
  let maxVal = -Infinity, maxIdx = end;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    if (data[end - i] >= maxVal) { maxVal = data[end - i]; maxIdx = end - i; }
  }
  return end - maxIdx; // bars ago
}

function lowest(data: number[], end: number, period: number): number {
  let min = Infinity;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    min = Math.min(min, data[end - i]);
  }
  return min;
}

function lowestBars(data: number[], end: number, period: number): number {
  let minVal = Infinity, minIdx = end;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    if (data[end - i] <= minVal) { minVal = data[end - i]; minIdx = end - i; }
  }
  return end - minIdx; // bars ago
}

// ALMA (Arnaud Legoux Moving Average)
function alma(data: number[], end: number, windowSize: number, offset: number, sigma: number): number {
  const m = Math.floor(offset * (windowSize - 1));
  const s = windowSize / sigma;
  let norm = 0, sum = 0;
  for (let i = 0; i < windowSize && (end - i) >= 0; i++) {
    const w = Math.exp(-((i - m) * (i - m)) / (2 * s * s));
    norm += w;
    sum += data[end - i] * w;
  }
  return norm !== 0 ? sum / norm : 0;
}

// ============ ML2: Linear Regression Line with EMA 20 ============

export interface ML2Params {
  regressionLength: number;
  emaLength: number;
}

const DEFAULT_ML2: ML2Params = { regressionLength: 14, emaLength: 20 };

export function parseML2Params(script: string): ML2Params | null {
  const isML2 = script.includes("Linear Regression Line with EMA") ||
                script.includes("ML2") ||
                (script.includes("Linear Regression") && script.includes("ema") && !script.includes("Bull and Bear"));
  if (!isML2) return null;

  const params = { ...DEFAULT_ML2 };
  const lenMatch = script.match(/length\s*=\s*input\s*\(\s*(\d+)/);
  if (lenMatch) params.regressionLength = parseInt(lenMatch[1]);
  const emaMatch = script.match(/emaLength\s*=\s*input\s*\(\s*(\d+)/);
  if (emaMatch) params.emaLength = parseInt(emaMatch[1]);
  return params;
}

export function calculateML2(candles: OHLCData[], params: ML2Params): IndicatorResult | null {
  const len = candles.length;
  if (len < params.regressionLength + 5) return null;

  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);
  const barIndices = candles.map((_, i) => i);

  // Linear Regression Line
  const regLine: { time: number; value: number }[] = [];
  for (let i = params.regressionLength - 1; i < len; i++) {
    const x_mean = sma(barIndices, params.regressionLength, i);
    const y_mean = sma(closes, params.regressionLength, i);
    const mx = stdev(barIndices, params.regressionLength, i);
    const my = stdev(closes, params.regressionLength, i);
    const c = correlation(barIndices, closes, params.regressionLength, i);

    if (mx === 0) {
      regLine.push({ time: times[i], value: y_mean });
      continue;
    }
    const slope = c * (my / mx);
    const inter = y_mean - slope * x_mean;
    const reg = barIndices[i] * slope + inter;
    regLine.push({ time: times[i], value: reg });
  }

  // EMA 20
  const emaValues = ema(closes, params.emaLength);
  const emaLine: { time: number; value: number }[] = [];
  for (let i = params.emaLength - 1; i < len; i++) {
    emaLine.push({ time: times[i], value: emaValues[i] });
  }

  return {
    name: "ML2 Linear Regression + EMA",
    type: "line",
    lines: [
      { label: "Linear Regression", color: "#FF0000", data: regLine, lineWidth: 2 },
      { label: `EMA ${params.emaLength}`, color: "#2196F3", data: emaLine, lineWidth: 2 },
    ],
  };
}

// ============ ML3: Linear Regression Bull and Bear Power ============

export interface ML3Params {
  window: number;
  smooth: boolean;
  smoothFactor: number;
  sigma: number;
}

const DEFAULT_ML3: ML3Params = { window: 10, smooth: true, smoothFactor: 5, sigma: 6 };

export function parseML3Params(script: string): ML3Params | null {
  const isML3 = script.includes("Bull and Bear Power") ||
                script.includes("BBP_NM") ||
                script.includes("ML3") ||
                script.includes("f_exp_lr");
  if (!isML3) return null;

  const params = { ...DEFAULT_ML3 };
  const winMatch = script.match(/window\s*=\s*input\s*\([^)]*defval\s*=\s*(\d+)/);
  if (winMatch) params.window = parseInt(winMatch[1]);
  const smoothMatch = script.match(/smooth\s*=\s*input\s*\([^)]*defval\s*=\s*(true|false)/);
  if (smoothMatch) params.smooth = smoothMatch[1] === "true";
  const smapMatch = script.match(/smap\s*=\s*input\s*\([^)]*defval\s*=\s*(\d+)/);
  if (smapMatch) params.smoothFactor = parseInt(smapMatch[1]);
  const sigmaMatch = script.match(/sigma\s*=\s*input\s*\([^)]*defval\s*=\s*(\d+)/);
  if (sigmaMatch) params.sigma = parseInt(sigmaMatch[1]);
  return params;
}

function f_exp_lr(height: number, length: number): number {
  if (length === 0) return height;
  return height + (height / length);
}

export interface ML3Signal {
  time: number;
  type: "buy" | "sell";
  price: number;
}

export function calculateML3(candles: OHLCData[], params: ML3Params): {
  indicators: IndicatorResult | null;
} {
  const len = candles.length;
  if (len < params.window + 5) return { indicators: null };

  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);

  const bull: number[] = new Array(len).fill(0);
  const bear: number[] = new Array(len).fill(0);
  const direction: number[] = new Array(len).fill(0);
  const dirColor: ("green" | "red" | "yellow")[] = new Array(len).fill("yellow");

  for (let i = params.window - 1; i < len; i++) {
    const hValue = highest(closes, i, params.window);
    const lValue = lowest(closes, i, params.window);
    const hBarsAgo = highestBars(closes, i, params.window);
    const lBarsAgo = lowestBars(closes, i, params.window);

    const nMinusHBar = hBarsAgo > 0 ? hBarsAgo : 1;
    const nMinusLBar = lBarsAgo > 0 ? lBarsAgo : 1;

    const bearRaw = f_exp_lr(hValue - closes[i], nMinusHBar);
    bear[i] = bearRaw > 0 ? -bearRaw : 0;

    const bullRaw = f_exp_lr(closes[i] - lValue, nMinusLBar);
    bull[i] = bullRaw > 0 ? bullRaw : 0;
  }

  // Direction calculation
  if (params.smooth) {
    const rawDir = bull.map((b, i) => b + bear[i]);
    for (let i = params.window - 1; i < len; i++) {
      direction[i] = alma(rawDir, i, params.smoothFactor, 0.9, params.sigma);
    }
    for (let i = params.window; i < len; i++) {
      if (direction[i] > direction[i - 1]) dirColor[i] = "green";
      else if (direction[i] < direction[i - 1]) dirColor[i] = "red";
      else dirColor[i] = "yellow";
    }
  } else {
    for (let i = params.window - 1; i < len; i++) {
      direction[i] = bull[i] * 3 + bear[i] * 3;
      if (direction[i] > bull[i]) dirColor[i] = "green";
      else if (direction[i] < bear[i]) dirColor[i] = "red";
      else dirColor[i] = "yellow";
    }
  }

  const startIdx = params.window - 1;

  const bearData: { time: number; value: number }[] = [];
  const bullData: { time: number; value: number }[] = [];
  const dirGreenData: { time: number; value: number }[] = [];
  const dirRedData: { time: number; value: number }[] = [];

  for (let i = startIdx; i < len; i++) {
    bearData.push({ time: times[i], value: bear[i] });
    bullData.push({ time: times[i], value: bull[i] });

    const isGreen = dirColor[i] === "green" || dirColor[i] === "yellow";
    const prevIsGreen = i > startIdx && (dirColor[i - 1] === "green" || dirColor[i - 1] === "yellow");

    if (isGreen) {
      // Add overlap point at transition from red to green
      if (i > startIdx && !prevIsGreen) {
        dirGreenData.push({ time: times[i - 1], value: direction[i - 1] });
      }
      dirGreenData.push({ time: times[i], value: direction[i] });
    } else {
      // Add overlap point at transition from green to red
      if (i > startIdx && prevIsGreen) {
        dirRedData.push({ time: times[i - 1], value: direction[i - 1] });
      }
      dirRedData.push({ time: times[i], value: direction[i] });
    }
  }

  return {
    indicators: {
      name: "ML3 Bull Bear Power",
      type: "line",
      lines: [
        { label: "Bear", color: "#FF4444", data: bearData, lineWidth: 1 },
        { label: "Bull", color: "#44FF44", data: bullData, lineWidth: 1 },
        { label: "Dir ▲", color: "#00FF00", data: dirGreenData, lineWidth: 3 },
        { label: "Dir ▼", color: "#FF0055", data: dirRedData, lineWidth: 3 },
      ],
    },
  };
}

// Combined detection
export function parseML2or3(script: string): { type: "ml2"; params: ML2Params } | { type: "ml3"; params: ML3Params } | null {
  const ml2 = parseML2Params(script);
  if (ml2) return { type: "ml2", params: ml2 };
  const ml3 = parseML3Params(script);
  if (ml3) return { type: "ml3", params: ml3 };
  return null;
}
