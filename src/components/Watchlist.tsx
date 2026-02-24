import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Search, Loader2, Plus, X } from "lucide-react";
import { searchSymbol } from "@/lib/api";
import { IDX_STOCKS, Stock } from "@/lib/idx-stocks";

interface WatchlistProps {
  onSelectStock: (symbol: string) => void;
  selectedSymbol: string;
}

export default function Watchlist({ onSelectStock, selectedSymbol }: WatchlistProps) {
  const [search, setSearch] = useState("");
  const [watchlist, setWatchlist] = useState<Stock[]>([
    { symbol: "BBCA", name: "Bank Central Asia", exchange: "IDX", type: "stock" },
  ]);
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const localMatches = IDX_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20);

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      return;
    }

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
        setSearchResults(idxStocks.length > 0 ? idxStocks : []);
      }
    } catch {
      setSearchResults([]);
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

  const addToWatchlist = (stock: Stock) => {
    if (!watchlist.find((s) => s.symbol === stock.symbol)) {
      setWatchlist((prev) => [...prev, stock]);
    }
    setSearch("");
    setIsSearchMode(false);
    setSearchResults([]);
    onSelectStock(stock.symbol);
  };

  const removeFromWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const isInWatchlist = (symbol: string) => watchlist.some((s) => s.symbol === symbol);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            Watchlist
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {watchlist.length}
            </span>
          </h2>
          <button
            onClick={() => setIsSearchMode(!isSearchMode)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Tambah saham"
          >
            {isSearchMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        {isSearchMode && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari saham untuk ditambah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-secondary text-foreground text-sm pl-8 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            {searching && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Search results */}
        {isSearchMode && search.length >= 2 && searchResults.length > 0 && (
          <div className="border-b border-border">
            <div className="px-3 py-1.5 text-xs text-muted-foreground bg-secondary/50">Hasil pencarian</div>
            {searchResults.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => addToWatchlist(stock)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-border/30 hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                </div>
                {isInWatchlist(stock.symbol) ? (
                  <span className="text-xs text-muted-foreground">✓</span>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {isSearchMode && search.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            Tidak ditemukan "{search}"
          </div>
        )}

        {/* Watchlist items */}
        {(!isSearchMode || search.length < 2) && (
          <>
            {watchlist.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-border/50 hover:bg-accent transition-colors ${
                  selectedSymbol === stock.symbol ? "bg-accent" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                </div>
                <button
                  onClick={(e) => removeFromWatchlist(stock.symbol, e)}
                  className="flex-shrink-0 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  title="Hapus dari watchlist"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {watchlist.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Watchlist kosong. Klik + untuk menambah saham.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
