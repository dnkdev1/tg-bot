// @ts-nocheck
// Adapter for Google's Gemini REST API (generateContent).
//
// Gemini itself is stateless: to "remember" the conversation, the caller sends
// the whole dialogue every time as an ordered list of turns, e.g.
//   [{ role: "user",  text: "previous question" },
//    { role: "model", text: "Gemini's previous answer" },
//    { role: "user",  text: "new question" }]
// The last turn must be the new user question.

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// "-latest" aliases follow Google's newest model, so old model names retiring
// (e.g. gemini-2.5-flash) doesn't break the bot. Lite answers in ~1-2s; the full
// Flash model was measured at 40s+ under load, too slow for a Telegram webhook.
const DEFAULT_MODEL = "gemini-flash-lite-latest";
// Telegram retries a webhook that doesn't answer quickly, so don't wait forever.
const REQUEST_TIMEOUT_MS = 25_000;

export class GeminiChatGateway {
  constructor(apiKey, { model = DEFAULT_MODEL, systemInstruction = null } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.systemInstruction = systemInstruction;
  }

  // turns: [{ role: "user" | "model", text: string }] → reply text
  async generateReply(turns) {
    const body = {
      contents: turns.map(({ role, text }) => ({ role, parts: [{ text }] })),
      // models "think" before answering by default; low keeps chat replies fast
      generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
      ...(this.systemInstruction
        ? { systemInstruction: { parts: [{ text: this.systemInstruction }] } }
        : {}),
    };

    const res = await fetch(`${API_BASE}/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // header instead of ?key= so the key never ends up in URL logs
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[gemini] generateContent failed:", res.status, data?.error?.message);
      throw new Error(`Gemini request failed with status ${res.status}`);
    }

    // a reply can be split across several parts; blocked replies have no text
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      console.error("[gemini] empty reply:", data.candidates?.[0]?.finishReason, data.promptFeedback);
      throw new Error("Gemini returned an empty reply");
    }
    return text;
  }
}
