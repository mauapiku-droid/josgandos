import { useEffect, useState } from "react";
import { IDX_STOCKS } from "@/lib/idx-stocks";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Generate realistic ticker data from the full IDX stock list
function generateTickerData(): TickerItem[] {
  const basePrices: Record<string, number> = {
    BBCA: 9875, BBRI: 4650, BMRI: 6350, BBNI: 5200, TLKM: 3420,
    ASII: 5225, UNVR: 3180, GOTO: 74, BREN: 6900, ADRO: 2700,
    ANTM: 1530, PTBA: 2970, HMSP: 820, GGRM: 26500, ICBP: 11200,
    INDF: 6700, KLBF: 1565, PGAS: 1350, SMGR: 4100, AMMN: 8200,
    MDKA: 2500, ITMG: 27800, HRUM: 1400, MEDC: 1200, MBMA: 560,
    BRIS: 2700, ARTO: 2450, EMTK: 490, CPIN: 5100, MNCN: 720,
    JPFA: 1500, INKP: 9200, TKIM: 6800, INCO: 4500, ESSA: 800,
    BRPT: 1100, TBIG: 2200, TOWR: 1050, EXCL: 2400, ISAT: 8100,
    BSDE: 1100, CTRA: 1200, SMRA: 700, PWON: 480, ERAA: 510,
    ACES: 740, MAPI: 1700, LPPF: 3200, SIDO: 750, MYOR: 2600,
    UNTR: 26500, AALI: 6200, AKRA: 1400, JSMR: 4500, WIKA: 680,
  };

  return IDX_STOCKS.slice(0, 50).map((stock) => {
    const base = basePrices[stock.symbol] || Math.floor(Math.random() * 5000) + 100;
    const changePct = (Math.random() - 0.5) * 6;
    return {
      symbol: stock.symbol,
      price: Math.round(base * (1 + changePct / 100)),
      change: changePct,
      changePercent: Number(changePct.toFixed(2)),
    };
  });
}

const TICKER_DATA: TickerItem[] = generateTickerData();

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
