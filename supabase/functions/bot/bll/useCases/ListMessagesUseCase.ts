// @ts-nocheck
import { Message } from "../entities/Message.ts";

export class ListMessagesUseCase {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ userId } = {}) {
    const records = await this.messageRepository.list();
    const messages = records.map((record) => new Message(record));
    if (userId == null) return messages;
    return messages.filter((message) => String(message.userId) === String(userId));
  }
}
