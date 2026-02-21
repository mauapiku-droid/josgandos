import { useState } from "react";
import { Star, Search } from "lucide-react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const DEFAULT_WATCHLIST: Stock[] = [
  { symbol: "BBCA", name: "Bank Central Asia", price: 9875, change: 75, changePercent: 0.77 },
  { symbol: "BBRI", name: "Bank Rakyat Indo", price: 4650, change: -30, changePercent: -0.64 },
  { symbol: "TLKM", name: "Telkom Indonesia", price: 3420, change: 28, changePercent: 0.59 },
  { symbol: "ASII", name: "Astra International", price: 5225, change: -50, changePercent: -0.95 },
  { symbol: "BMRI", name: "Bank Mandiri", price: 6350, change: 100, changePercent: 1.60 },
  { symbol: "UNVR", name: "Unilever Indonesia", price: 3180, change: -15, changePercent: -0.47 },
  { symbol: "GOTO", name: "GoTo Gojek Tokped", price: 74, change: 2, changePercent: 2.78 },
  { symbol: "BREN", name: "Barito Renewables", price: 6975, change: 125, changePercent: 1.82 },
  { symbol: "ADRO", name: "Adaro Energy", price: 2700, change: -20, changePercent: -0.74 },
  { symbol: "ANTM", name: "Aneka Tambang", price: 1545, change: 15, changePercent: 0.98 },
  { symbol: "PGAS", name: "Perusahaan Gas", price: 1360, change: 5, changePercent: 0.37 },
  { symbol: "INDF", name: "Indofood Sukses", price: 6700, change: -25, changePercent: -0.37 },
];

interface WatchlistProps {
  onSelectStock: (symbol: string) => void;
  selectedSymbol: string;
}

export default function Watchlist({ onSelectStock, selectedSymbol }: WatchlistProps) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BBCA", "BMRI"]));

  const filtered = DEFAULT_WATCHLIST.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">Watchlist</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari saham..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm pl-8 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((stock) => (
          <div
            key={stock.symbol}
            onClick={() => onSelectStock(stock.symbol)}
            className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-border/50 hover:bg-accent transition-colors ${
              selectedSymbol === stock.symbol ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={(e) => toggleFavorite(stock.symbol, e)}
                className="flex-shrink-0"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    favorites.has(stock.symbol)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{stock.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-sm font-mono font-semibold text-foreground">
                {stock.price.toLocaleString()}
              </div>
              <div
                className={`text-xs font-mono ${
                  stock.change >= 0 ? "text-gain" : "text-loss"
                }`}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change} ({stock.change >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
