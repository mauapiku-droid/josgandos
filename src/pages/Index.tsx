import { useState } from "react";
import { BarChart3, Code2, LayoutGrid } from "lucide-react";
import Watchlist from "@/components/Watchlist";
import StockChart from "@/components/StockChart";
import AIAssistant from "@/components/AIAssistant";
import TickerBar from "@/components/TickerBar";

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BBCA");
  const [showAI, setShowAI] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-foreground">IDX Chart</span>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            {selectedSymbol} · IDX
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-1.5 rounded transition-colors ${
              showAI ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle AI Assistant"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Watchlist */}
        <div className="w-64 flex-shrink-0">
          <Watchlist onSelectStock={setSelectedSymbol} selectedSymbol={selectedSymbol} />
        </div>

        {/* Chart */}
        <div className="flex-1 min-w-0">
          <StockChart symbol={selectedSymbol} />
        </div>

        {/* AI Assistant */}
        {showAI && (
          <div className="w-72 flex-shrink-0">
            <AIAssistant />
          </div>
        )}
      </div>

      {/* Ticker Bar */}
      <TickerBar />
    </div>
  );
};

export default Index;
