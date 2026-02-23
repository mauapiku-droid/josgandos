import { useState } from "react";
import { Code2, Plus, ChevronDown, ChevronUp, Trash2, Brain, TrendingUp, BarChart3 } from "lucide-react";
import { INDICATOR_TEMPLATES } from "@/lib/pinescript";

interface IndicatorPanelProps {
  scripts: string[];
  onAddScript: (script: string) => void;
  onRemoveScript: (index: number) => void;
  activeIndicators: string[];
}

const ML_TEMPLATE = `// Machine Learning: Logistic Regression (v.3)
lookback   = input(2, 'Lookback Window Size')
nlbk       = input(2, 'Normalization Lookback')
lrate      = input(0.0009, 'Learning Rate')
iterations = input(1000, 'Training Iterations')
holding_p  = input(1, 'Holding Period')
curves     = input(false, 'Show Loss & Prediction Curves?')
useprice   = input(true, 'Use Price Data for Signal Generation?')
logistic_regression(base, synth, lookback, lrate, iterations)`;

const ML2_TEMPLATE = `// ML2: Linear Regression Line with EMA 20
length = input(14, 'Regression Length')
emaLength = input(20, 'EMA Length')
Linear Regression
ema(close, emaLength)`;

const ML3_TEMPLATE = `// ML3: Improved Linear Regression Bull and Bear Power v02
window = input(title='Lookback Window:', type=integer, defval=10)
smooth = input(title='Smooth ?', type=bool, defval=true)
smap = input(title='Smooth factor', type=integer, defval=5, minval=2, maxval=10)
sigma = input(title='Sigma', type=integer, defval=6)
f_exp_lr
Bull and Bear Power`;

export default function IndicatorPanel({
  scripts,
  onAddScript,
  onRemoveScript,
  activeIndicators,
}: IndicatorPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [customScript, setCustomScript] = useState(
    `// Contoh PineScript Indicator\n// Anda bisa paste script dari TradingView\n\n// Moving Averages\nta.sma(close, 20)\nta.ema(close, 50)\n\n// RSI\n// ta.rsi(close, 14)\n\n// MACD\n// ta.macd(close, 12, 26, 9)\n\n// Bollinger Bands\n// ta.bb(close, 20, 2)`
  );

  const isMLActive = activeIndicators.includes("ML Logistic Regression");
  const isML2Active = activeIndicators.includes("ML2 Linear Regression + EMA");
  const isML3Active = activeIndicators.includes("ML3 Bull Bear Power");

  const handleAddCustom = () => {
    if (customScript.trim()) {
      onAddScript(customScript);
      setShowEditor(false);
    }
  };

  const handleAddML = () => { if (!isMLActive) onAddScript(ML_TEMPLATE); };
  const handleAddML2 = () => { if (!isML2Active) onAddScript(ML2_TEMPLATE); };
  const handleAddML3 = () => { if (!isML3Active) onAddScript(ML3_TEMPLATE); };

  const getScriptPreview = (script: string): string => {
    if (script.includes("logistic_regression") || script.includes("Machine Learning") || script.includes("Logistic Regression") || script.includes("sigmoid")) {
      return "ML: Logistic Regression";
    }
    if (script.includes("ML2") || (script.includes("Linear Regression") && script.includes("EMA") && !script.includes("Bull"))) {
      return "ML2: LinReg + EMA";
    }
    if (script.includes("ML3") || script.includes("Bull and Bear Power") || script.includes("f_exp_lr")) {
      return "ML3: Bull Bear Power";
    }
    return script.split("\n").filter(l => l.trim() && !l.trim().startsWith("//")).join(", ").slice(0, 40);
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>Indicators ({activeIndicators.length})</span>
        {isOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {isOpen && (
        <div className="px-3 pb-2 space-y-2">
          {/* Quick add templates */}
          <div className="flex flex-wrap gap-1">
            {INDICATOR_TEMPLATES.map((tpl) => {
              const isActive = activeIndicators.includes(tpl.name);
              return (
                <button
                  key={tpl.name}
                  onClick={() => {
                    if (!isActive) onAddScript(tpl.script);
                  }}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {tpl.name}
                </button>
              );
            })}

            {/* ML buttons */}
            <button
              onClick={handleAddML}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                isMLActive
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                  : "border-purple-500/30 text-purple-400/70 hover:text-purple-400 hover:border-purple-500/50"
              }`}
            >
              <Brain className="w-3 h-3" />
              ML 1
            </button>
            <button
              onClick={handleAddML2}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                isML2Active
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-red-500/30 text-red-400/70 hover:text-red-400 hover:border-red-500/50"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              ML 2
            </button>
            <button
              onClick={handleAddML3}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                isML3Active
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-green-500/30 text-green-400/70 hover:text-green-400 hover:border-green-500/50"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              ML 3
            </button>
          </div>

          {/* Active indicators */}
          {scripts.length > 0 && (
            <div className="space-y-1">
              {scripts.map((script, i) => {
                const preview = getScriptPreview(script);
                const isML = preview.includes("ML:");
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      isML ? "bg-purple-500/10 border border-purple-500/20" : "bg-secondary"
                    }`}
                  >
                    <span className={`text-xs font-mono truncate flex-1 ${
                      isML ? "text-purple-300" : "text-secondary-foreground"
                    }`}>
                      {isML && <Brain className="w-3 h-3 inline mr-1" />}
                      {preview}
                    </span>
                    <button
                      onClick={() => onRemoveScript(i)}
                      className="text-muted-foreground hover:text-destructive ml-1 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom PineScript editor */}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Custom PineScript
          </button>

          {showEditor && (
            <div className="space-y-2">
              <textarea
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                className="w-full h-40 bg-background text-foreground text-xs font-mono p-2 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none scrollbar-thin"
                placeholder="Paste PineScript indicator code here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCustom}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported: ta.sma(), ta.ema(), ta.rsi(), ta.macd(), ta.bb(), ML 1 (LogReg), ML 2 (LinReg+EMA), ML 3 (Bull Bear Power) — atau paste langsung PineScript dari TradingView
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
