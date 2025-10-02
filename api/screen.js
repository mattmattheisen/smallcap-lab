// /api/screen.js
// Placeholder screener endpoint. Accepts query params, returns echo + mock result.
// Example: /api/screen?minDollarVol=2000000&minPrice=3&confidence=0.7

module.exports = (req, res) => {
  try {
    const {
      minDollarVol = "1000000",
      minPrice = "3",
      maxDebtToEbitda = "2.5",
      minFScore = "6",
      minGrossProf = "0",       // % as number
      excludeEarningsWindow = "true",
      confidence = "0.7",       // tie-in to HMM later
    } = req.query || {};

    const parsed = {
      minDollarVol: Number(minDollarVol),
      minPrice: Number(minPrice),
      maxDebtToEbitda: Number(maxDebtToEbitda),
      minFScore: Number(minFScore),
      minGrossProf: Number(minGrossProf),
      excludeEarningsWindow: excludeEarningsWindow === "true",
      confidence: Number(confidence),
    };

    // TODO: replace with real screen logic & data source
    const mock = [
      {
        symbol: "AEIS",
        name: "Advanced Energy Industries, Inc.",
        price: 125.42,
        adv: 3200000,
        grossProfitabilityPct: 12.4,
        fScore: 7,
        netDebtToEbitda: 1.9,
        hmmConfidence: parsed.confidence,
        note: "MOCK DATA — replace with live screen",
      },
      {
        symbol: "SOFI",
        name: "SoFi Technologies, Inc.",
        price: 26.84,
        adv: 54000000,
        grossProfitabilityPct: 8.1,
        fScore: 6,
        netDebtToEbitda: 2.3,
        hmmConfidence: parsed.confidence,
        note: "MOCK DATA — replace with live screen",
      },
    ];

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      criteria: parsed,
      count: mock.length,
      results: mock,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
