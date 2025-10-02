// /api/screen.js
// Real data: calls Financial Modeling Prep's stock screener.
// Docs: https://financialmodelingprep.com/developer/docs/stock-screener-api/
// Start with coarse filters (price, avg volume, market cap) and return a compact list.
// NOTE: This is a first pass; we’ll enrich with quality/value filters in later steps.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

module.exports = async (req, res) => {
  try {
    const {
      minDollarVol = "2000000",  // $2M/day default
      minPrice = "3",            // avoid pennies
      marketCapMin = "300000000",// $300M
      limit = "50",              // cap result size
      exchange = "NASDAQ,NYSE,AMEX", // liquid US listings
      confidence = "0.7",        // passthrough for now (HMM later)
    } = req.query || {};

    const parsed = {
      minDollarVol: Number(minDollarVol),
      minPrice: Number(minPrice),
      marketCapMin: Number(marketCapMin),
      limit: clamp(Number(limit), 1, 200),
      exchange,
      confidence: Number(confidence),
    };

    // Approximate averageVolume requirement from minDollarVol and minPrice
    const avgVolMoreThan = Math.max(
      100000, // floor to avoid absurdly low volumes
      Math.floor(parsed.minDollarVol / Math.max(parsed.minPrice, 1))
    );

    const key = process.env.FMP_API_KEY || "demo";
    const url = new URL("https://financialmodelingprep.com/api/v3/stock-screener");
    url.searchParams.set("priceMoreThan", String(parsed.minPrice));
    url.searchParams.set("averageVolumeMoreThan", String(avgVolMoreThan));
    url.searchParams.set("marketCapMoreThan", String(parsed.marketCapMin));
    url.searchParams.set("exchange", parsed.exchange);
    url.searchParams.set("isActivelyTrading", "true");
    url.searchParams.set("limit", String(parsed.limit));
    url.searchParams.set("apikey", key);

    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ ok: false, error: "Upstream error", detail: txt.slice(0, 400) });
    }
    const data = await r.json();

    // Map to a clean shape (and keep top N)
    const results = (Array.isArray(data) ? data : []).map(row => ({
      symbol: row.symbol,
      name: row.companyName || row.company || null,
      exchange: row.exchangeShortName || row.exchange || null,
      price: typeof row.price === "number" ? row.price : null,
      avgVolume: row.avgVolume || row.averageVolume || null,
      marketCap: row.marketCap || null,
      sector: row.sector || null,
      industry: row.industry || null,
      // placeholders we’ll compute later:
      hmmConfidence: parsed.confidence,
      notes: "FMP screener result; quality/value filters to be applied in later step.",
    }));

    return res.status(200).json({
      ok: true,
      criteria: {
        ...parsed,
        avgVolDerivedFromDollarVol: avgVolMoreThan,
      },
      count: results.length,
      results,
      source: "financialmodelingprep.com",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
