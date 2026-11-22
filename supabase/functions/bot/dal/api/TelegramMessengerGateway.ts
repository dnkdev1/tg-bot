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

  // Shows "typing…" in the chat for ~5s (or until the next message arrives).
  // Purely cosmetic, so a failure is only logged.
  async sendChatAction(chatId, action) {
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action }),
      });
    } catch (error) {
      console.error("[telegram] sendChatAction failed:", error);
    }
  }
}
