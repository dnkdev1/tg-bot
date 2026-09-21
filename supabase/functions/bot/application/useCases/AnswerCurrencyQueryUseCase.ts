// @ts-nocheck
// "in"/"to" (English) and "в" (Russian) all introduce the target currency
const TARGET_SPLIT_REGEX = /^(.*?)\s+(?:in|to|в)\s+(.+)$/iu;
const AMOUNT_REGEX = /^(\d+(?:[.,]\d+)?)\s*(.+)$/;
const TERM_SPLIT_REGEX = /\s*([+-])\s*/;
// an optional leading label some clients/users prefix queries with, e.g. "currency: 20 EUR in USD"
const LEADING_LABEL_REGEX = /^(?:currency|convert|conversion|валюта|конвертация|конверт)\s*:?\s*/i;

function stripLeadingLabel(text) {
  return text.trim().replace(LEADING_LABEL_REGEX, "");
}

function splitSourceAndTarget(rawText) {
  const match = stripLeadingLabel(rawText).match(TARGET_SPLIT_REGEX);
  if (!match) {
    return { sourcePart: stripLeadingLabel(rawText), targetPart: null };
  }

  const [, sourcePart, targetPart] = match;
  return { sourcePart, targetPart };
}

// spelled-out operators ("plus"/"minus", "плюс"/"минус") count the same as +/-
function normalizeOperatorWords(text) {
  return text
    .replace(/\s+(?:plus|плюс)\s+/giu, " + ")
    .replace(/\s+(?:minus|минус)\s+/giu, " - ");
}

// splits a compound query like "100 USD + 50 EUR - 10 GBP" into signed terms
function splitTerms(sourcePart) {
  const pieces = normalizeOperatorWords(sourcePart.trim())
    .split(TERM_SPLIT_REGEX)
    .filter((piece) => piece !== "");

  const terms = [];
  let sign = 1;
  for (const piece of pieces) {
    if (piece === "+" || piece === "-") {
      sign = piece === "-" ? -1 : 1;
      continue;
    }
    terms.push({ sign, text: piece.trim() });
    sign = 1;
  }
  return terms;
}

function parseAmountAndCurrency(termText) {
  const match = termText.match(AMOUNT_REGEX);
  if (!match) {
    return { amountLabel: "1", amount: 1, currencyText: termText };
  }

  const [, amountLabel, currencyText] = match;
  return { amountLabel, amount: parseFloat(amountLabel.replace(",", ".")), currencyText };
}

export class AnswerCurrencyQueryUseCase {
  constructor(currencyDirectory, currencyRateGateway, messengerGateway) {
    this.currencyDirectory = currencyDirectory;
    this.currencyRateGateway = currencyRateGateway;
    this.messengerGateway = messengerGateway;
  }

  async execute({ chatId, rawText }) {
    const { sourcePart, targetPart } = splitSourceAndTarget(rawText);

    const terms = [];
    for (const { sign, text } of splitTerms(sourcePart)) {
      const { amountLabel, amount, currencyText } = parseAmountAndCurrency(text);
      const code = await this.currencyDirectory.resolveCode(currencyText);
      terms.push({ sign, amountLabel, amount, code });
    }

    const targetCode = targetPart
      ? await this.currencyDirectory.resolveCode(targetPart)
      : "USD";

    const hasUnknownCode = terms.length === 0 || !targetCode || terms.some((term) => !term.code);

    const codesToFetch = [...new Set([targetCode, ...terms.map((term) => term.code)])];
    const rates = hasUnknownCode ? {} : await this.currencyRateGateway.getRates(codesToFetch);

    const targetRate = rates[targetCode];
    let total = 0;
    let missingRate = targetRate == null;
    for (const term of terms) {
      const rate = rates[term.code];
      if (rate == null) {
        missingRate = true;
        continue;
      }
      total += term.sign * (term.amount / rate) * targetRate;
    }

    for (const term of terms) {
      term.flag = term.code ? await this.currencyDirectory.getFlag(term.code) : "";
    }

    const breakdown = terms
      .map((term, index) => {
        const label = `${term.amountLabel} ${term.code || "?"}${term.flag ? ` ${term.flag}` : ""}`;
        if (index === 0) return term.sign < 0 ? `-${label}` : label;
        return term.sign < 0 ? ` - ${label}` : ` + ${label}`;
      })
      .join("");

    const targetFlag = !hasUnknownCode ? await this.currencyDirectory.getFlag(targetCode) : "";

    const reply =
      hasUnknownCode || missingRate
        ? `Unknown currency: ${rawText}`
        : `${breakdown} = ${total.toFixed(2)} ${targetCode}${targetFlag ? ` ${targetFlag}` : ""}`;

    await this.messengerGateway.sendMessage(chatId, reply);
    return reply;
  }
}
