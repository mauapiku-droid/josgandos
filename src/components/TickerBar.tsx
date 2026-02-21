import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const TICKER_DATA: TickerItem[] = [
  { symbol: "IHSG", price: 7288, change: -0.29, changePercent: -0.29 },
  { symbol: "BBCA", price: 9875, change: 0.77, changePercent: 0.77 },
  { symbol: "ADRO", price: 2700, change: -0.74, changePercent: -0.74 },
  { symbol: "PTBA", price: 2970, change: 0.68, changePercent: 0.68 },
  { symbol: "TLKM", price: 3420, change: 0.59, changePercent: 0.59 },
  { symbol: "BMRI", price: 6350, change: 1.60, changePercent: 1.60 },
  { symbol: "GOTO", price: 74, change: 2.78, changePercent: 2.78 },
  { symbol: "BBRI", price: 4650, change: -0.64, changePercent: -0.64 },
  { symbol: "ASII", price: 5225, change: -0.95, changePercent: -0.95 },
  { symbol: "UNVR", price: 3180, change: -0.47, changePercent: -0.47 },
];

export default function TickerBar() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

  return (
    <div className="h-7 bg-card border-t border-border overflow-hidden relative">
      <div
        className="flex items-center h-full gap-8 whitespace-nowrap absolute"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-mono">
            <span className="text-foreground font-semibold">{item.symbol}</span>
            <span className="text-muted-foreground">{item.price.toLocaleString()}</span>
            <span className={item.change >= 0 ? "text-gain" : "text-loss"}>
              {item.change >= 0 ? "+" : ""}
              {item.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
