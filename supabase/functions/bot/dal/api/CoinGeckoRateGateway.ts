// @ts-nocheck
export const COINGECKO_ID_BY_CODE = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  XRP: "ripple",
};

const PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

export class CoinGeckoRateGateway {
  // returns each code's rate as "units of that code per 1 USD" (1 / USD price),
  // matching the convention the fiat rate gateway uses, so both can be mixed
  // in one rates map and the same conversion math works for either.
  async getRates(codes) {
    const ids = codes.map((code) => COINGECKO_ID_BY_CODE[code]).filter(Boolean);
    if (ids.length === 0) return {};

    const url = `${PRICE_URL}?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url);
    if (!res.ok) return {};

    const data = await res.json();
    const result = {};
    for (const code of codes) {
      const id = COINGECKO_ID_BY_CODE[code];
      const usdPrice = id ? data[id]?.usd : null;
      result[code] = usdPrice ? 1 / usdPrice : null;
    }
    return result;
  }

  async getRate(code) {
    const rates = await this.getRates([code]);
    return rates[code];
  }
}
