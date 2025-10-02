// /api/screen.js
// Free-tier screener using FMP exchange quote lists, then filtering in code.
// Works with free keys (and even 'demo' for limited tests).

const EXCHANGES = ["nyse", "nasdaq", "amex"];

async function fetchExchangeQuotes(exchange, apikey) {
  const url = `https://financialmodelingprep.com/api/v3/quotes/${exchange}?apikey=${apikey}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`FMP quotes/${exchange} ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

module.exports = async (req, res) => {
  try {
    const {
      minDollarVol = "2000000",     // $2M/day
      minPrice = "3",
      marketCapMin = "300000000",   // $300M
      limit = "200",                // cap result size
      exchanges = "NYSE,NASDAQ,AMEX",
      confidence = "0.7",
    } = req.query || {};

    const key = process.env.FMP_API_KEY || "demo";

    const minP = Number(minPrice);
    const minDV = Number(minDollarVol);
    const minMC = Number(marketCapMin);
    const lim = Math.max(1, Math.min(Number(limit) || 200, 1000));

    // Build list of exchanges to hit
    const wanted = exchanges
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(x => ["nyse", "nasdaq", "amex"].includes(x));

    const unique = new Set();
    const merged = [];

    // Fetch quotes from each exchange and merge (free endpoint)
    for (const ex of wanted) {
      const rows = await fetchExchangeQuotes(ex, key);
      for (const row of rows) {
        // Basic guards
        const symbol = row.symbol || row.name;
        if (!symbol || unique.has(symbol)) continue;
        unique.add(symbol);

        const price = Number(row.price ?? row.price || 0);
        const volume = Number(row.volume ?? row.avgVolume ?? 0);
        const marketCap = Number(row.marketCap ?? 0);

        // Derive dollar volume
        const dollarVol = price * volume;

        // Apply coarse filters
        if (price >= minP && marketCap >= minMC && dollarVol >= minDV) {
          merged.push({
            symbol,
            name: row.name || row.companyName || null,
            exchange: row.exchange || ex.toUpperCase(),
            price,
            volume,
            avgVolume: Number(row.avgVolume ?? 0),
            dollarVol,
            marketCap,
            pe: row.pe ?? null,
            eps: row.eps ?? null,
            priceAvg50: row.priceAvg50 ?? null,
            priceAvg200: row.priceAvg200 ?? null,
            yearHigh: row.yearHigh ?? null,
            yearLow: row.yearLow ?? null,
            // placeholder for later quality signal
            hmmConfidence: Number(confidence),
          });
        }
      }
    }

    // Sort by dollar volume desc, cap to limit
    merged.sort((a, b) => (b.dollarVol || 0) - (a.dollarVol || 0));
    const results = merged.slice(0, lim);

    return res.status(200).json({
      ok: true,
      count: results.length,
      criteria: {
        minPrice: minP,
        marketCapMin: minMC,
        minDollarVol: minDV,
        exchanges: wanted.map(e => e.toUpperCase()),
        confidence: Number(confidence),
        limit: lim
      },
      results,
      source: "FMP /api/v3/quotes/{nyse|nasdaq|amex} (free)",
      note: "First-pass screen. Next step: add quality filters (Piotroski, Profitability)."
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
