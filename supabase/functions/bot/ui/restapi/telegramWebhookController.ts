// @ts-nocheck
// UI layer: turns a Telegram update into use-case calls. It talks only to BLL;
// sending replies and saving messages happen inside the use cases.
import { BOT_DISPLAY_NAME } from "../../bll/botIdentity.ts";

const DASHBOARD_COMMANDS = new Set(["/start", "/dashboard", "/app"]);

export async function handleTelegramWebhook(req, {
  matchedToken,
  expectedToken,
  recordMessageUseCase,
  answerCurrencyQueryUseCase,
  askGeminiUseCase, // null when GEMINI_API_KEY isn't set
  sendDashboardLinkUseCase,
  dashboardUrl,
}) {
  if (matchedToken !== expectedToken) {
    return new Response(null, { status: 404 });
  }

  const update = await req.json();
  console.log(update);

  if (update.message && update.message.text) {
    const userId = update.message.from.id;
    const chatId = update.message.chat.id;
    const text = update.message.text;
    const firstName = update.message.from.first_name ?? null;
    const lastName = update.message.from.last_name ?? null;

    await recordMessageUseCase.execute({
      from: update.message.from.username || update.message.from.first_name,
      text,
      date: new Date(update.message.date * 1000).toISOString(),
      userId,
      firstName,
      lastName,
    });

    if (DASHBOARD_COMMANDS.has(text.trim().toLowerCase())) {
      await sendDashboardLinkUseCase.execute({ chatId, dashboardUrl });
    } else {
      // currency queries first; anything the parser doesn't understand goes to Gemini
      let answerReply = await answerCurrencyQueryUseCase.execute({
        chatId,
        rawText: text,
        replyOnUnknown: !askGeminiUseCase,
      });
      if (answerReply == null) {
        answerReply = await askGeminiUseCase.execute({ chatId, userId });
      }

      // a failed Gemini call returns null: nothing to save, keeps history clean
      if (answerReply != null) {
        await recordMessageUseCase.execute({
          from: BOT_DISPLAY_NAME,
          text: answerReply,
          date: new Date().toISOString(),
          userId,
          firstName,
          lastName,
        });
      }
    }
  }

  return Response.json({});
}
