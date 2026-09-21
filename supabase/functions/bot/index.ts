// @ts-nocheck
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import { StaticCurrencyDirectory } from "./infrastructure/gateways/StaticCurrencyDirectory.ts";
import { ExchangeRateApiGateway } from "./infrastructure/gateways/ExchangeRateApiGateway.ts";
import { CoinGeckoRateGateway } from "./infrastructure/gateways/CoinGeckoRateGateway.ts";
import { CompositeCurrencyRateGateway } from "./infrastructure/gateways/CompositeCurrencyRateGateway.ts";
import { TelegramMessengerGateway } from "./infrastructure/gateways/TelegramMessengerGateway.ts";
import { SupabaseMessageRepository } from "./infrastructure/repositories/SupabaseMessageRepository.ts";

import { RecordMessageUseCase } from "./application/useCases/RecordMessageUseCase.ts";
import { ListMessagesUseCase } from "./application/useCases/ListMessagesUseCase.ts";
import { AnswerCurrencyQueryUseCase } from "./application/useCases/AnswerCurrencyQueryUseCase.ts";
import { GetLiveRatesUseCase } from "./application/useCases/GetLiveRatesUseCase.ts";

import { handleTelegramWebhook } from "./interfaceAdapters/controllers/telegramWebhookController.ts";
import { handleMessagesJson } from "./interfaceAdapters/controllers/messagesJsonController.ts";
import { handleMessagesPage } from "./interfaceAdapters/controllers/messagesPageController.ts";
import {
  handleMiniAppPage,
  handleRatesJson,
  handleMyMessagesJson,
} from "./interfaceAdapters/controllers/miniAppController.ts";

const token = Deno.env.get("BOT_TOKEN");
if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

// infrastructure: concrete implementations wired once per isolate. The message
// repository is created per-request below since it needs ctx.supabaseAdmin.
const currencyDirectory = new StaticCurrencyDirectory();
const currencyRateGateway = new CompositeCurrencyRateGateway(new ExchangeRateApiGateway(), new CoinGeckoRateGateway());
const messengerGateway = new TelegramMessengerGateway(token);
const getLiveRatesUseCase = new GetLiveRatesUseCase(currencyDirectory, currencyRateGateway);
const answerCurrencyQueryUseCase = new AnswerCurrencyQueryUseCase(currencyDirectory, currencyRateGateway, messengerGateway);

// The Supabase edge runtime strips the "/functions/v1/" prefix from req.url
// before invoking the function, so req.url's own path can't be used to derive
// the externally-reachable base path (it comes back missing that prefix).
// Routes are still matched by suffix below, since that's unaffected either way.
const FUNCTION_BASE_PATH = "/functions/v1/bot";
const WEBHOOK_SUFFIX_RE = /\/webhook\/([^/]+)\/?$/;

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const url = new URL(req.url);

    const messageRepository = new SupabaseMessageRepository(ctx.supabaseAdmin);
    const recordMessageUseCase = new RecordMessageUseCase(messageRepository);
    const listMessagesUseCase = new ListMessagesUseCase(messageRepository);

    const webhookMatch = req.method === "POST" && url.pathname.match(WEBHOOK_SUFFIX_RE);
    if (webhookMatch) {
      // the edge runtime reports req.url with an "http:" scheme even though the
      // real request always arrives over HTTPS; Telegram rejects web_app button
      // URLs that aren't https, so the scheme is forced here.
      const httpsOrigin = url.origin.replace(/^http:/, "https:");
      return handleTelegramWebhook(req, {
        matchedToken: webhookMatch[1],
        expectedToken: token,
        recordMessageUseCase,
        answerCurrencyQueryUseCase,
        messengerGateway,
        dashboardUrl: `${httpsOrigin}${FUNCTION_BASE_PATH}/app`,
      });
    }

    if (req.method === "GET" && url.pathname.endsWith("/messages.json")) {
      return handleMessagesJson(listMessagesUseCase);
    }

    if (req.method === "GET" && url.pathname.endsWith("/rates.json")) {
      return handleRatesJson(getLiveRatesUseCase);
    }

    if (req.method === "GET" && url.pathname.endsWith("/my-messages.json")) {
      return handleMyMessagesJson(url, listMessagesUseCase, token);
    }

    if (req.method === "GET" && url.pathname.endsWith("/app")) {
      return handleMiniAppPage(FUNCTION_BASE_PATH);
    }

    if (req.method === "GET") {
      return handleMessagesPage(listMessagesUseCase, FUNCTION_BASE_PATH);
    }

    return new Response("Not Found", { status: 404 });
  }),
};
