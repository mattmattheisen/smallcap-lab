// ...keep the top of the file as-is

    const key = process.env.FMP_API_KEY || "demo";

    // NEW: use the stable company screener
    const url = new URL("https://financialmodelingprep.com/stable/company-screener");

    // Most legacy params still work on stable; these are supported on the new screener:
    // priceMoreThan, averageVolumeMoreThan, marketCapMoreThan, exchange, isActivelyTrading, limit
    url.searchParams.set("priceMoreThan", String(parsed.minPrice));
    url.searchParams.set("averageVolumeMoreThan", String(avgVolMoreThan));
    url.searchParams.set("marketCapMoreThan", String(parsed.marketCapMin));
    url.searchParams.set("exchange", parsed.exchange);
    url.searchParams.set("isActivelyTrading", "true");
    url.searchParams.set("limit", String(parsed.limit));
    url.searchParams.set("apikey", key);

    const r = await fetch(url.toString(), { cache: "no-store" });
