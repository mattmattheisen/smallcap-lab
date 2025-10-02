// /api/screen.js
// Free-tier screener using FMP exchange quote lists, then filtering in code.
// Robust to non-JSON upstream responses and partial exchange failures.

const EXCHANGES = ["nyse", "nasdaq", "amex"];

async function fetchExchangeQuotes(exchange, apikey) {
  const url = `https://financialmodelingprep.com/api/v3/quotes/${exchange}?apikey=${apikey}`;
  const r = await fetch(url, { cache: "no-store" });

  // Handle non-OK responses with readable detail
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`FMP quotes/${exchange} ${r.status} — ${txt.slice(0,180)}`);
  }

  // Handle non-JSON replies gracefully
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const txt = await r.text().catch(() => "");
    throw new Error(`FMP quotes/${exchange} non-JSON: ${txt.slice(0,180)}`);
  }

  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

module.exports = async (req, res) => {
  try {
    const {
      minDollarVol = "2000000",     // $2M/day
      minPrice = "3",
      marketCapMin = "300000000",   // $300M
      limit = "200",                // max results to return
      exchanges = "NYSE,NASDAQ,AMEX",
      confidence = "0.7",
    } = req.query || {};

    const key = process.env.FMP_API_KEY || "demo";

    const minP = Number(minPrice);
    const minDV = Number(minDollarVol);
    const minMC = Number(marketCapMin);
    const lim = Math.max(1, Math.min(Number(limit) || 200, 1000));

    // Exchanges to fetch
    const wanted = exchanges
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(x => EXCHANGES.includes(x));

    const unique = new Set();
    const merged = [];
    const warnings = [];

    // Fetch each exchange independently; skip if one fails
    for (const ex of wanted) {
      try {
        const rows = await fetchExchangeQuotes(ex, key);
        for (const row of rows) {
          const symbol = row.symbol || row.name;
          if (!symbol || unique.has(symbol)) continue;
          unique.add(symbol);

          const price = Number(row.price ?? 0);
          const volume = Number(row.volume ?? row.avgVolume ?? 0);
          const marketCap = Number(row.marketCap ?? 0);
          const dollarVol = price * volume;

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
              hmmConfidence: Number(confidence),
            });
          }
        }
      } catch (e) {
        warnings.push(String(e));
      }
    }

    merged.sort((a, b) => (b.dollarVol || 0) - (a.dollarVol || 0));
    const results = merged.slice(0, lim);

    res.setHeader("content-type", "application/json; charset=utf-8");
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
      warnings, // shows any exchange that failed so you know what happened
      note: "First-pass screen. Next: add quality filters (Piotroski, Profitability)."
    });
  } catch (err) {
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
