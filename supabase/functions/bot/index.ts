// @ts-nocheck
import "@supabase/functions-js/edge-runtime.d.ts";

import { getDatabase } from "./dal/adapters/database.ts";

import { StaticCurrencyDirectory } from "./dal/repositories/StaticCurrencyDirectory.ts";
import { ExchangeRateApiGateway } from "./dal/api/ExchangeRateApiGateway.ts";
import { CoinGeckoRateGateway } from "./dal/api/CoinGeckoRateGateway.ts";
import { CompositeCurrencyRateGateway } from "./dal/api/CompositeCurrencyRateGateway.ts";
import { TelegramMessengerGateway } from "./dal/api/TelegramMessengerGateway.ts";
import { GeminiChatGateway } from "./dal/api/GeminiChatGateway.ts";
import { SupabaseMessageRepository } from "./dal/repositories/SupabaseMessageRepository.ts";

import { RecordMessageUseCase } from "./bll/useCases/RecordMessageUseCase.ts";
import { ListMessagesUseCase } from "./bll/useCases/ListMessagesUseCase.ts";
import { AnswerCurrencyQueryUseCase } from "./bll/useCases/AnswerCurrencyQueryUseCase.ts";
import { GetLiveRatesUseCase } from "./bll/useCases/GetLiveRatesUseCase.ts";
import { AskGeminiUseCase } from "./bll/useCases/AskGeminiUseCase.ts";
import { SendDashboardLinkUseCase } from "./bll/useCases/SendDashboardLinkUseCase.ts";
import { BOT_DISPLAY_NAME, BOT_SYSTEM_INSTRUCTION } from "./bll/botIdentity.ts";

import { handleTelegramWebhook } from "./ui/restapi/telegramWebhookController.ts";
import { handleMessagesJson } from "./ui/restapi/messagesJsonController.ts";
import { handleMessagesPage } from "./ui/restapi/messagesPageController.ts";
import {
  handleMiniAppPage,
  handleRatesJson,
  handleMyMessagesJson,
} from "./ui/restapi/miniAppController.ts";

const token = Deno.env.get("BOT_TOKEN");
if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

// Wiring (composition root): DAL objects are created first and handed to the BLL
// use cases, which are handed to the UI controllers below. Everything is built
// once per isolate.
// The database connection comes from the shared adapter, the only place the app
// connects to the database.
const messageRepository = new SupabaseMessageRepository(getDatabase());
const recordMessageUseCase = new RecordMessageUseCase(messageRepository);
const listMessagesUseCase = new ListMessagesUseCase(messageRepository);

const currencyDirectory = new StaticCurrencyDirectory();
const currencyRateGateway = new CompositeCurrencyRateGateway(new ExchangeRateApiGateway(), new CoinGeckoRateGateway());
const messengerGateway = new TelegramMessengerGateway(token);
const getLiveRatesUseCase = new GetLiveRatesUseCase(currencyDirectory, currencyRateGateway);
const answerCurrencyQueryUseCase = new AnswerCurrencyQueryUseCase(currencyDirectory, currencyRateGateway, messengerGateway);
const sendDashboardLinkUseCase = new SendDashboardLinkUseCase(messengerGateway);

// Gemini is optional: without the key the bot keeps working as a plain
// currency converter instead of failing to start.
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY is not set; free-form messages get 'Unknown currency'");
}
const geminiChatGateway = geminiApiKey
  ? new GeminiChatGateway(geminiApiKey, {
    // empty/unset → the gateway's default model
    model: Deno.env.get("GEMINI_MODEL") || undefined,
    systemInstruction: BOT_SYSTEM_INSTRUCTION,
  })
  : null;
const askGeminiUseCase = geminiChatGateway
  ? new AskGeminiUseCase(messageRepository, geminiChatGateway, messengerGateway, { botAuthor: BOT_DISPLAY_NAME })
  : null;

// The Supabase edge runtime strips the "/functions/v1/" prefix from req.url
// before invoking the function, so req.url's own path can't be used to derive
// the externally-reachable base path (it comes back missing that prefix).
// Routes are still matched by suffix below, since that's unaffected either way.
const FUNCTION_BASE_PATH = "/functions/v1/bot";
const WEBHOOK_SUFFIX_RE = /\/webhook\/([^/]+)\/?$/;

export default {
  // No withSupabase() wrapper: the bot has no logged-in users (Telegram is
  // checked via the webhook token / initData instead), and the database now
  // comes from the shared adapter rather than ctx.supabaseAdmin.
  async fetch(req) {
    const url = new URL(req.url);

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
        askGeminiUseCase,
        sendDashboardLinkUseCase,
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
  },
};
