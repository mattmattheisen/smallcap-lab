# SmallCap Lab — API Endpoints (alpha)

## GET /api/health
Returns service heartbeat.
- **Example:** `/api/health`

## GET /api/screen
Placeholder small-cap screener. Echoes criteria and returns mock results.
- **Params:**
  - `minDollarVol` (number, default 1000000)
  - `minPrice` (number, default 3)
  - `maxDebtToEbitda` (number, default 2.5)
  - `minFScore` (number, default 6)
  - `minGrossProf` (number %, default 0)
  - `excludeEarningsWindow` ("true" | "false", default "true")
  - `confidence` (0..1, default 0.7)
- **Example:** `/api/screen?minDollarVol=2000000&minPrice=3&confidence=0.7`

## GET /api/signal
Placeholder HMM/Kelly sizing scaffold.
- **Params:**
  - `symbol` (string, default "AEIS")
  - `conf` (0..1 Risk-On prob, default 0.7)
  - `mu` (mean excess return per period, default 0.01)
  - `sigma` (vol per period, default 0.05)
  - `kellyMode` ("quarter" | "half" | "full", default "half")
  - `maxWeight` (cap per name, default 0.07)
- **Example:** `/api/signal?symbol=AEIS&kellyMode=half&conf=0.72&mu=0.018&sigma=0.07`
