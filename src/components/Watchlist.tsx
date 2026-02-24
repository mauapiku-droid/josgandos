import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Search, Loader2 } from "lucide-react";
import { searchSymbol } from "@/lib/api";
import { IDX_STOCKS, Stock } from "@/lib/idx-stocks";

interface WatchlistProps {
  onSelectStock: (symbol: string) => void;
  selectedSymbol: string;
}

export default function Watchlist({ onSelectStock, selectedSymbol }: WatchlistProps) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BBCA", "BMRI", "BBRI", "TLKM"]));
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search IDX stocks from API when query is longer and not in local list
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // First filter local stocks
    const localMatches = IDX_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      return;
    }

    // If no local match, search via API
    setSearching(true);
    try {
      const result = await searchSymbol(query);
      if (result?.data && Array.isArray(result.data)) {
        const idxStocks = result.data
          .filter((s: any) => s.exchange === "IDX" && s.type === "stock")
          .map((s: any) => ({
            symbol: s.symbol,
            name: s.description,
            exchange: s.exchange,
            type: s.type,
          }));
        setSearchResults(idxStocks.length > 0 ? idxStocks : localMatches);
      }
    } catch {
      setSearchResults(localMatches);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, handleSearch]);

  const displayStocks = search.length >= 2 ? searchResults : IDX_STOCKS;

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  // Sort: favorites first, then alphabetical
  const sorted = [...displayStocks].sort((a, b) => {
    const aFav = favorites.has(a.symbol) ? 0 : 1;
    const bFav = favorites.has(b.symbol) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Watchlist
          <span className="text-xs text-muted-foreground font-normal ml-2">
            {IDX_STOCKS.length} saham
          </span>
        </h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari saham..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm pl-8 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          {searching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sorted.map((stock) => (
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
          </div>
        ))}
        {search.length >= 2 && sorted.length === 0 && !searching && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Tidak ditemukan saham "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
