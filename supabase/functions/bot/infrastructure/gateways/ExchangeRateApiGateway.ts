// @ts-nocheck
const LATEST_URL = "https://open.er-api.com/v6/latest/USD";

export class ExchangeRateApiGateway {
  async getRates(codes) {
    const res = await fetch(LATEST_URL);
    if (!res.ok) return {};

    const data = await res.json();
    const result = {};
    for (const code of codes) {
      result[code] = data.rates[code] ?? null;
    }
    return result;
  }

  async getRate(code) {
    const rates = await this.getRates([code]);
    return rates[code];
  }
}
