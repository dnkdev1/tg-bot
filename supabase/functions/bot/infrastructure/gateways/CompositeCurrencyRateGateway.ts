// @ts-nocheck
import { CRYPTO_CODES } from "./StaticCurrencyDirectory.ts";

export class CompositeCurrencyRateGateway {
  constructor(fiatGateway, cryptoGateway) {
    this.fiatGateway = fiatGateway;
    this.cryptoGateway = cryptoGateway;
  }

  async getRates(codes) {
    const fiatCodes = codes.filter((code) => !CRYPTO_CODES.has(code));
    const cryptoCodes = codes.filter((code) => CRYPTO_CODES.has(code));

    const [fiatRates, cryptoRates] = await Promise.all([
      fiatCodes.length ? this.fiatGateway.getRates(fiatCodes) : {},
      cryptoCodes.length ? this.cryptoGateway.getRates(cryptoCodes) : {},
    ]);

    return { ...fiatRates, ...cryptoRates };
  }

  async getRate(code) {
    const rates = await this.getRates([code]);
    return rates[code];
  }
}
