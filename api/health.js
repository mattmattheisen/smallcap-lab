// /api/health.js
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    app: "SmallCap Lab",
    runtime: "vercel-node",
    time: new Date().toISOString(),
  });
};
