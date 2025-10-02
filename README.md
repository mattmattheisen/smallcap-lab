# smallcap-lab
# SmallCap Lab

A small-cap equity screener with HMM (regime) signals and Kelly sizing.
Tech: Next.js + Vercel Functions + TypeScript. HMM model for risk-on/off, Kelly for position sizing.

Roadmap:
- Screener (liquidity, quality, growth/value, sentiment)
- HMM regime filter (3-state Gaussian)
- Kelly sizing (1/4–1/2 Kelly by default)
- Backtests with realistic slippage/liquidity constraints
