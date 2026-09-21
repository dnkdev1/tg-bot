// @ts-nocheck
const BOT_DISPLAY_NAME = "@ClearExchangeBot";
const DASHBOARD_COMMANDS = new Set(["/start", "/dashboard", "/app"]);

export async function handleTelegramWebhook(req, {
  matchedToken,
  expectedToken,
  recordMessageUseCase,
  answerCurrencyQueryUseCase,
  messengerGateway,
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
      await messengerGateway.sendMessage(chatId, "Open your live rates and query history:", {
        inline_keyboard: [[{ text: "📊 Open Dashboard", web_app: { url: dashboardUrl } }]],
      });
    } else {
      const answerReply = await answerCurrencyQueryUseCase.execute({ chatId, rawText: text });

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

  return Response.json({});
}
