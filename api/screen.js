// /api/screen.js
// Screener using FMP's stable company-screener endpoint
// Docs: https://site.financialmodelingprep.com/developer/docs/company-screener-api/

module.exports = async (req, res) => {
  try {
    const {
      minDollarVol = "2000000",
      minPrice = "3",
      marketCapMin = "300000000",
      limit = "50",
      exchange = "NASDAQ,NYSE,AMEX",
      confidence = "0.7",
    } = req.query || {};

    const avgVolMoreThan = Math.max(
      100000,
      Math.floor(Number(minDollarVol) / Math.max(Number(minPrice), 1))
    );

    const key = process.env.FMP_API_KEY || "demo";

    // ✅ Correct endpoint
    const url = new URL("https://financialmodelingprep.com/stable/company-screener");
    url.searchParams.set("priceMoreThan", String(minPrice));
    url.searchParams.set("averageVolumeMoreThan", String(avgVolMoreThan));
    url.searchParams.set("marketCapMoreThan", String(marketCapMin));
    url.searchParams.set("exchange", exchange);
    url.searchParams.set("isActivelyTrading", "true");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("apikey", key);

    const r = await fetch(url.toString(), { cache: "no-store" });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({
        ok: false,
        error: "Upstream error",
        detail: txt.slice(0, 400),
        url: url.toString(),
      });
    }

    const data = await r.json();

    return res.status(200).json({
      ok: true,
      count: data.length,
      criteria: { minDollarVol, minPrice, marketCapMin, avgVolMoreThan, confidence },
      results: data,
      source: "FMP stable company-screener",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
