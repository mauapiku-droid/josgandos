import { useState } from "react";
import { Code2, Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { INDICATOR_TEMPLATES } from "@/lib/pinescript";

interface IndicatorPanelProps {
  scripts: string[];
  onAddScript: (script: string) => void;
  onRemoveScript: (index: number) => void;
  activeIndicators: string[];
}

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

  const handleAddCustom = () => {
    if (customScript.trim()) {
      onAddScript(customScript);
      setShowEditor(false);
    }
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
          </div>

          {/* Active indicators */}
          {scripts.length > 0 && (
            <div className="space-y-1">
              {scripts.map((script, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-secondary rounded px-2 py-1"
                >
                  <span className="text-xs text-secondary-foreground font-mono truncate flex-1">
                    {script.split("\n").filter(l => l.trim() && !l.trim().startsWith("//")).join(", ").slice(0, 40)}
                  </span>
                  <button
                    onClick={() => onRemoveScript(i)}
                    className="text-muted-foreground hover:text-loss ml-1 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
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
                Supported: ta.sma(), ta.ema(), ta.rsi(), ta.macd(), ta.bb() — atau shorthand: SMA 20, EMA 50
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
