// @ts-nocheck
export class TelegramMessengerGateway {
  constructor(botToken) {
    this.botToken = botToken;
  }

  async sendMessage(chatId, text, replyMarkup) {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram] sendMessage failed:", data);
    }
    return data;
  }
}
