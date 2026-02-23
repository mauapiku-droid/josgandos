// Machine Learning: Logistic Regression Indicator
// TypeScript implementation of the TradingView PineScript v4 indicator
// Original by: "Machine Learning: Logistic Regression (v.3)"

import { OHLCData, IndicatorResult } from "./pinescript";

export interface MLLogRegParams {
  lookback: number;       // Lookback Window Size (default: 2)
  nlbk: number;           // Normalization Lookback (default: 2, max: 240)
  lrate: number;          // Learning Rate (default: 0.0009)
  iterations: number;     // Training Iterations (default: 1000)
  holdingPeriod: number;  // Holding Period (default: 1)
  usePriceForSignal: boolean; // Use Price Data for Signal Generation
  showCurves: boolean;    // Show Loss & Prediction Curves
}

const DEFAULT_PARAMS: MLLogRegParams = {
  lookback: 2,
  nlbk: 2,
  lrate: 0.0009,
  iterations: 1000,
  holdingPeriod: 1,
  usePriceForSignal: true,
  showCurves: false,
};

// --- Math helpers ---

function sigmoid(z: number): number {
  return 1.0 / (1.0 + Math.exp(-z));
}

function dotProduct(v: number[], w: number[], start: number, period: number): number {
  let sum = 0;
  for (let i = 0; i < period && (start - i) >= 0; i++) {
    sum += v[start - i] * w[start - i];
  }
  return sum;
}

function sumWindow(arr: number[], end: number, period: number): number {
  let s = 0;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    s += arr[end - i];
  }
  return s;
}

function highest(arr: number[], end: number, period: number): number {
  let max = -Infinity;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    max = Math.max(max, arr[end - i]);
  }
  return max;
}

function lowest(arr: number[], end: number, period: number): number {
  let min = Infinity;
  for (let i = 0; i < period && (end - i) >= 0; i++) {
    min = Math.min(min, arr[end - i]);
  }
  return min;
}

function minimax(value: number, hi: number, lo: number, min: number, max: number): number {
  if (hi === lo) return (max + min) / 2;
  return (max - min) * (value - lo) / (hi - lo) + min;
}

// --- Core Logistic Regression ---

function logisticRegression(
  X: number[],
  Y: number[],
  idx: number,
  period: number,
  lr: number,
  iterations: number
): { loss: number; prediction: number } {
  let w = 0.0;
  let loss = 0.0;

  for (let iter = 0; iter < iterations; iter++) {
    // Compute hypothesis using dot product of X with weight
    let dotXW = 0;
    for (let j = 0; j < period && (idx - j) >= 0; j++) {
      dotXW += X[idx - j] * w;
    }
    const hypothesis = sigmoid(dotXW);

    // Compute loss (simplified binary cross-entropy)
    const h = Math.max(1e-10, Math.min(1 - 1e-10, hypothesis));
    const yVal = Y[idx] || 0;
    loss = -(yVal * Math.log(h) + (1 - yVal) * Math.log(1 - h));

    // Compute gradient
    let gradient = 0;
    for (let j = 0; j < period && (idx - j) >= 0; j++) {
      gradient += X[idx - j] * (hypothesis - (Y[idx - j] || 0));
    }
    gradient /= period;

    // Update weight
    w = w - lr * gradient;
  }

  // Final prediction
  let dotFinal = 0;
  for (let j = 0; j < period && (idx - j) >= 0; j++) {
    dotFinal += X[idx - j] * w;
  }

  return { loss, prediction: sigmoid(dotFinal) };
}

// --- Signal types ---

export interface MLSignal {
  time: number;
  type: "buy" | "sell" | "stopBuy" | "stopSell";
  price: number;
}

// --- Main Calculation ---

export function calculateMLLogReg(
  candles: OHLCData[],
  params: Partial<MLLogRegParams> = {}
): { indicators: IndicatorResult | null; signals: MLSignal[] } {
  const p = { ...DEFAULT_PARAMS, ...params };
  const len = candles.length;
  if (len < p.nlbk + 10) return { indicators: null, signals: [] };

  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);

  // Use time-based base and price-based synth (easteregg=true mode)
  const base = candles.map((_, i) => i + 1); // proxy for time index
  const synth = closes.slice(); // use price data

  // Compute loss and prediction at each bar
  const lossArr: number[] = new Array(len).fill(0);
  const predArr: number[] = new Array(len).fill(0);

  // Reduce iterations for performance on large datasets
  const effectiveIterations = Math.min(p.iterations, 200);

  for (let i = p.lookback; i < len; i++) {
    const { loss, prediction } = logisticRegression(
      base, synth, i, p.lookback, p.lrate, effectiveIterations
    );
    lossArr[i] = loss;
    predArr[i] = prediction;
  }

  // Normalize (minimax) to price range
  const scaledLoss: number[] = new Array(len).fill(0);
  const scaledPred: number[] = new Array(len).fill(0);

  for (let i = p.nlbk; i < len; i++) {
    const hi = highest(closes, i, p.nlbk);
    const lo = lowest(closes, i, p.nlbk);
    scaledLoss[i] = minimax(lossArr[i], highest(lossArr, i, p.nlbk), lowest(lossArr, i, p.nlbk), lo, hi);
    scaledPred[i] = minimax(predArr[i], highest(predArr, i, p.nlbk), lowest(predArr, i, p.nlbk), lo, hi);
  }

  // Generate signals
  const BUY = 1, SELL = -1, HOLD = 0;
  const signalArr: number[] = new Array(len).fill(HOLD);
  const signals: MLSignal[] = [];
  let hpCounter = 0;

  for (let i = Math.max(p.nlbk, 1); i < len; i++) {
    const prevSignal = signalArr[i - 1];

    if (p.usePriceForSignal) {
      if (closes[i] < scaledLoss[i]) {
        signalArr[i] = SELL;
      } else if (closes[i] > scaledLoss[i]) {
        signalArr[i] = BUY;
      } else {
        signalArr[i] = prevSignal;
      }
    } else {
      // crossunder / crossover detection
      const lossAbovePred = scaledLoss[i] < scaledPred[i];
      const lossAbovePredPrev = scaledLoss[i - 1] < scaledPred[i - 1];
      const lossBelowPred = scaledLoss[i] > scaledPred[i];
      const lossBelowPredPrev = scaledLoss[i - 1] > scaledPred[i - 1];

      if (lossAbovePred && !lossAbovePredPrev) {
        signalArr[i] = SELL;
      } else if (lossBelowPred && !lossBelowPredPrev) {
        signalArr[i] = BUY;
      } else {
        signalArr[i] = prevSignal;
      }
    }

    const changed = signalArr[i] !== prevSignal;
    hpCounter = changed ? 0 : hpCounter + 1;

    const startLong = changed && signalArr[i] === BUY;
    const startShort = changed && signalArr[i] === SELL;
    const endLong = (signalArr[i] === BUY && hpCounter === p.holdingPeriod && !changed) ||
                    (changed && signalArr[i] === SELL);
    const endShort = (signalArr[i] === SELL && hpCounter === p.holdingPeriod && !changed) ||
                     (changed && signalArr[i] === BUY);

    if (startLong) {
      signals.push({ time: times[i], type: "buy", price: candles[i].low });
    }
    if (startShort) {
      signals.push({ time: times[i], type: "sell", price: candles[i].high });
    }
    if (endLong) {
      signals.push({ time: times[i], type: "stopBuy", price: candles[i].high });
    }
    if (endShort) {
      signals.push({ time: times[i], type: "stopSell", price: candles[i].low });
    }
  }

  // Build indicator result for the curves
  const startIdx = p.nlbk;
  const lossLineData = [];
  const predLineData = [];

  for (let i = startIdx; i < len; i++) {
    lossLineData.push({ time: times[i], value: scaledLoss[i] });
    predLineData.push({ time: times[i], value: scaledPred[i] });
  }

  const lines: IndicatorResult["lines"] = [];

  if (p.showCurves) {
    lines.push({
      label: "Loss",
      color: "#2196F3",
      data: lossLineData,
      lineWidth: 2,
    });
    lines.push({
      label: "Prediction",
      color: "#CDDC39",
      data: predLineData,
      lineWidth: 2,
    });
  }

  // Always add a thin loss line for reference
  lines.push({
    label: "ML Signal Line",
    color: "rgba(33, 150, 243, 0.6)",
    data: lossLineData,
    lineWidth: 1,
    lineStyle: 2,
  });

  return {
    indicators: {
      name: "ML Logistic Regression",
      type: "line",
      lines,
    },
    signals,
  };
}

// Parse ML-specific parameters from PineScript code
export function parseMLParams(script: string): Partial<MLLogRegParams> | null {
  // Detect if this is the ML Logistic Regression script
  const isML = script.includes("logistic_regression") ||
               script.includes("Machine Learning") ||
               script.includes("Logistic Regression") ||
               script.match(/sigmoid/i);

  if (!isML) return null;

  const params: Partial<MLLogRegParams> = {};

  // Extract parameters from input() calls
  const lookbackMatch = script.match(/lookback\s*=\s*input\s*\(\s*(\d+)/);
  if (lookbackMatch) params.lookback = parseInt(lookbackMatch[1]);

  const nlbkMatch = script.match(/nlbk\s*=\s*input\s*\(\s*(\d+)/);
  if (nlbkMatch) params.nlbk = parseInt(nlbkMatch[1]);

  const lrateMatch = script.match(/lrate\s*=\s*input\s*\(\s*([\d.]+)/);
  if (lrateMatch) params.lrate = parseFloat(lrateMatch[1]);

  const iterMatch = script.match(/iterations\s*=\s*input\s*\(\s*(\d+)/);
  if (iterMatch) params.iterations = parseInt(iterMatch[1]);

  const holdingMatch = script.match(/holding_p\s*=\s*input\s*\(\s*(\d+)/);
  if (holdingMatch) params.holdingPeriod = parseInt(holdingMatch[1]);

  const curvesMatch = script.match(/curves\s*=\s*input\s*\(\s*(true|false)/);
  if (curvesMatch) params.showCurves = curvesMatch[1] === "true";

  const usePriceMatch = script.match(/useprice\s*=\s*input\s*\(\s*(true|false)/);
  if (usePriceMatch) params.usePriceForSignal = usePriceMatch[1] === "true";

  return params;
}
