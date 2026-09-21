// @ts-nocheck
import { Message } from "../../domain/entities/Message.ts";

const MESSENGER_TYPE = "telegram";

export class SupabaseMessageRepository {
  constructor(db) {
    this.db = db;
  }

  // Every message belongs to a row in `clients`; that row is created on the
  // user's first message and refreshed (names, last_message_at) on later ones.
  async save(message) {
    const clientId = await this.#touchClient(message);

    const { error } = await this.db.from("messages").insert({
      author: message.from,
      body: message.text,
      messenger_user_id: String(message.userId),
      messenger_type: MESSENGER_TYPE,
      client_id: clientId,
    });
    if (error) throw error;
  }

  async list() {
    const { data, error } = await this.db
      .from("messages")
      .select("author, body, created_at, messenger_user_id")
      .eq("messenger_type", MESSENGER_TYPE)
      .order("id", { ascending: true });
    if (error) throw error;

    return data.map((row) => new Message({
      from: row.author,
      text: row.body,
      date: row.created_at,
      userId: row.messenger_user_id,
    }));
  }

  async #touchClient({ userId, firstName, lastName, date }) {
    const telegramId = String(userId);
    // last_message_at is `timestamp without time zone`; Postgres drops the "Z"
    // offset on input, which leaves the UTC wall-clock time.
    const lastMessageAt = date;

    const { data: existing, error: findError } = await this.db
      .from("clients")
      .select("id")
      .eq("user_telegram_id", telegramId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      const { error } = await this.db
        .from("clients")
        .update({ first_name: firstName, last_name: lastName, last_message_at: lastMessageAt })
        .eq("id", existing.id);
      if (error) throw error;
      return existing.id;
    }

    const { data, error } = await this.db
      .from("clients")
      .insert({
        user_telegram_id: telegramId,
        first_name: firstName,
        last_name: lastName,
        last_message_at: lastMessageAt,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
}
