import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Search, Loader2 } from "lucide-react";
import { searchSymbol, fetchConstituents } from "@/lib/api";

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

// Comprehensive list of popular IDX stocks as fallback
const IDX_STOCKS: Stock[] = [
  { symbol: "BBCA", name: "Bank Central Asia", exchange: "IDX", type: "stock" },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "BMRI", name: "Bank Mandiri", exchange: "IDX", type: "stock" },
  { symbol: "BBNI", name: "Bank Negara Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "TLKM", name: "Telkom Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "ASII", name: "Astra International", exchange: "IDX", type: "stock" },
  { symbol: "UNVR", name: "Unilever Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "HMSP", name: "HM Sampoerna", exchange: "IDX", type: "stock" },
  { symbol: "GGRM", name: "Gudang Garam", exchange: "IDX", type: "stock" },
  { symbol: "ICBP", name: "Indofood CBP", exchange: "IDX", type: "stock" },
  { symbol: "INDF", name: "Indofood Sukses Makmur", exchange: "IDX", type: "stock" },
  { symbol: "KLBF", name: "Kalbe Farma", exchange: "IDX", type: "stock" },
  { symbol: "PGAS", name: "Perusahaan Gas Negara", exchange: "IDX", type: "stock" },
  { symbol: "PTBA", name: "Bukit Asam", exchange: "IDX", type: "stock" },
  { symbol: "SMGR", name: "Semen Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "ADRO", name: "Adaro Energy", exchange: "IDX", type: "stock" },
  { symbol: "ANTM", name: "Aneka Tambang", exchange: "IDX", type: "stock" },
  { symbol: "BREN", name: "Barito Renewables", exchange: "IDX", type: "stock" },
  { symbol: "GOTO", name: "GoTo Gojek Tokopedia", exchange: "IDX", type: "stock" },
  { symbol: "BRIS", name: "Bank Syariah Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "ARTO", name: "Bank Jago", exchange: "IDX", type: "stock" },
  { symbol: "EMTK", name: "Elang Mahkota Teknologi", exchange: "IDX", type: "stock" },
  { symbol: "MDKA", name: "Merdeka Copper Gold", exchange: "IDX", type: "stock" },
  { symbol: "CPIN", name: "Charoen Pokphand Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "MNCN", name: "Media Nusantara Citra", exchange: "IDX", type: "stock" },
  { symbol: "JPFA", name: "Japfa Comfeed Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "INKP", name: "Indah Kiat Pulp & Paper", exchange: "IDX", type: "stock" },
  { symbol: "TKIM", name: "Pabrik Kertas Tjiwi Kimia", exchange: "IDX", type: "stock" },
  { symbol: "ITMG", name: "Indo Tambangraya Megah", exchange: "IDX", type: "stock" },
  { symbol: "MEDC", name: "Medco Energi Internasional", exchange: "IDX", type: "stock" },
  { symbol: "INCO", name: "Vale Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "ESSA", name: "Surya Esa Perkasa", exchange: "IDX", type: "stock" },
  { symbol: "BRPT", name: "Barito Pacific", exchange: "IDX", type: "stock" },
  { symbol: "TBIG", name: "Tower Bersama Infrastructure", exchange: "IDX", type: "stock" },
  { symbol: "TOWR", name: "Sarana Menara Nusantara", exchange: "IDX", type: "stock" },
  { symbol: "EXCL", name: "XL Axiata", exchange: "IDX", type: "stock" },
  { symbol: "ISAT", name: "Indosat Ooredoo Hutchison", exchange: "IDX", type: "stock" },
  { symbol: "JSMR", name: "Jasa Marga", exchange: "IDX", type: "stock" },
  { symbol: "WIKA", name: "Wijaya Karya", exchange: "IDX", type: "stock" },
  { symbol: "WSKT", name: "Waskita Karya", exchange: "IDX", type: "stock" },
  { symbol: "PTPP", name: "PP (Persero)", exchange: "IDX", type: "stock" },
  { symbol: "BSDE", name: "Bumi Serpong Damai", exchange: "IDX", type: "stock" },
  { symbol: "CTRA", name: "Ciputra Development", exchange: "IDX", type: "stock" },
  { symbol: "SMRA", name: "Summarecon Agung", exchange: "IDX", type: "stock" },
  { symbol: "PWON", name: "Pakuwon Jati", exchange: "IDX", type: "stock" },
  { symbol: "ERAA", name: "Erajaya Swasembada", exchange: "IDX", type: "stock" },
  { symbol: "ACES", name: "Ace Hardware Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "MAPI", name: "Mitra Adiperkasa", exchange: "IDX", type: "stock" },
  { symbol: "LPPF", name: "Matahari Department Store", exchange: "IDX", type: "stock" },
  { symbol: "SIDO", name: "Industri Jamu Sido Muncul", exchange: "IDX", type: "stock" },
  { symbol: "MYOR", name: "Mayora Indah", exchange: "IDX", type: "stock" },
  { symbol: "UNTR", name: "United Tractors", exchange: "IDX", type: "stock" },
  { symbol: "AALI", name: "Astra Agro Lestari", exchange: "IDX", type: "stock" },
  { symbol: "LSIP", name: "PP London Sumatra Indonesia", exchange: "IDX", type: "stock" },
  { symbol: "SCMA", name: "Surya Citra Media", exchange: "IDX", type: "stock" },
  { symbol: "AKRA", name: "AKR Corporindo", exchange: "IDX", type: "stock" },
  { symbol: "BNLI", name: "Bank Permata", exchange: "IDX", type: "stock" },
  { symbol: "MEGA", name: "Bank Mega", exchange: "IDX", type: "stock" },
  { symbol: "NISP", name: "Bank OCBC NISP", exchange: "IDX", type: "stock" },
  { symbol: "BDMN", name: "Bank Danamon", exchange: "IDX", type: "stock" },
  { symbol: "BTPS", name: "Bank BTPN Syariah", exchange: "IDX", type: "stock" },
  { symbol: "BJTM", name: "Bank Jatim", exchange: "IDX", type: "stock" },
  { symbol: "BJBR", name: "Bank BJB", exchange: "IDX", type: "stock" },
  { symbol: "AMMN", name: "Amman Mineral Internasional", exchange: "IDX", type: "stock" },
  { symbol: "TPIA", name: "Chandra Asri Pacific", exchange: "IDX", type: "stock" },
  { symbol: "PGEO", name: "Pertamina Geothermal Energy", exchange: "IDX", type: "stock" },
  { symbol: "MBMA", name: "Merdeka Battery Materials", exchange: "IDX", type: "stock" },
  { symbol: "HRUM", name: "Harum Energy", exchange: "IDX", type: "stock" },
  { symbol: "BUKA", name: "Bukalapak.com", exchange: "IDX", type: "stock" },
  { symbol: "HEAL", name: "Medikaloka Hermina", exchange: "IDX", type: "stock" },
  { symbol: "MTEL", name: "Dayamitra Telekomunikasi", exchange: "IDX", type: "stock" },
];

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
