// @ts-nocheck
import { Message } from "../../domain/entities/Message.ts";

export class RecordMessageUseCase {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ from, text, date, userId, firstName, lastName }) {
    const message = new Message({ from, text, date, userId, firstName, lastName });
    await this.messageRepository.save(message);
    return message;
  }
}
