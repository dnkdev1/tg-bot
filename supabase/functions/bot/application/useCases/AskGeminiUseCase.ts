// @ts-nocheck
// Answers a free-form message with Gemini, giving it the recent dialogue as
// context so follow-up questions ("and in GBP?", "why?") make sense.

// Telegram rejects messages longer than this
const TELEGRAM_MAX_LENGTH = 4096;
// Bot replies that are not real answers; sending them to Gemini as its own
// past words would only confuse it.
const NOISE_REPLY_PREFIXES = ["Unknown currency:"];
const FAILURE_REPLY = "Sorry, I couldn't get an answer right now. Please try again in a moment.";

function splitForTelegram(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += TELEGRAM_MAX_LENGTH) {
    chunks.push(text.slice(i, i + TELEGRAM_MAX_LENGTH));
  }
  return chunks;
}

export class AskGeminiUseCase {
  constructor(messageRepository, chatGateway, messengerGateway, { botAuthor, historyLimit = 10 }) {
    this.messageRepository = messageRepository;
    this.chatGateway = chatGateway;
    this.messengerGateway = messengerGateway;
    this.botAuthor = botAuthor;
    this.historyLimit = historyLimit;
  }

  // The question itself must already be saved: it is read back as the last
  // history row. Returns the reply text, or null if Gemini failed.
  async execute({ chatId, userId }) {
    await this.messengerGateway.sendChatAction(chatId, "typing");

    const history = await this.messageRepository.listRecentForUser(userId, this.historyLimit);
    const turns = this.#toTurns(history);

    let reply;
    try {
      reply = await this.chatGateway.generateReply(turns);
    } catch (error) {
      console.error("[gemini] no reply:", error);
      await this.messengerGateway.sendMessage(chatId, FAILURE_REPLY);
      return null;
    }

    for (const chunk of splitForTelegram(reply)) {
      await this.messengerGateway.sendMessage(chatId, chunk);
    }
    return reply;
  }

  // Message rows → [{ role: "user" | "model", text }], in the shape Gemini wants:
  // starts with the user, and consecutive messages from the same side merged
  // (e.g. two user messages in a row after a failed answer).
  #toTurns(history) {
    const turns = [];
    for (const message of history) {
      const role = message.from === this.botAuthor ? "model" : "user";
      if (role === "model" && NOISE_REPLY_PREFIXES.some((p) => message.text.startsWith(p))) continue;
      if (turns.length === 0 && role === "model") continue;

      const last = turns[turns.length - 1];
      if (last && last.role === role) {
        last.text += `\n\n${message.text}`;
      } else {
        turns.push({ role, text: message.text });
      }
    }
    return turns;
  }
}
