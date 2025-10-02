// /api/signal.js
// Placeholder HMM/regime signal + Kelly sizing scaffold.
// Example: /api/signal?symbol=AEIS&kellyMode=half&conf=0.72&mu=0.018&sigma=0.07

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function kellyGaussian(mu, sigma) {
  // f* ≈ mu / sigma^2 (per-period excess return & variance)
  if (!sigma || sigma <= 0) return 0;
  return mu / (sigma * sigma);
}

function scaleKelly(mode = "half", f) {
  const m = mode === "full" ? 1 : mode === "quarter" ? 0.25 : 0.5;
  return f * m;
}

module.exports = (req, res) => {
  try {
    const {
      symbol = "AEIS",
      conf = "0.7",       // P(Risk-On) — from HMM later
      mu = "0.01",        // mean excess return per period (mock)
      sigma = "0.05",     // volatility per period (mock)
      kellyMode = "half", // quarter | half | full
      maxWeight = "0.07", // 7% per name cap
    } = req.query || {};

    const pRiskOn = clamp(Number(conf), 0, 1);
    const fStar = kellyGaussian(Number(mu), Number(sigma));
    const adj = scaleKelly(kellyMode, fStar) * pRiskOn;
    const weight = clamp(adj, 0, Number(maxWeight));

    return res.status(200).json({
      ok: true,
      symbol,
      inputs: {
        pRiskOn,
        mu: Number(mu),
        sigma: Number(sigma),
        kellyMode,
        maxWeight: Number(maxWeight),
      },
      outputs: {
        kellyRaw: fStar,
        kellyAdj: adj,
        suggestedWeight: weight,
      },
      note: "MOCK SIGNAL — wire to real HMM + per-name stats next",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
