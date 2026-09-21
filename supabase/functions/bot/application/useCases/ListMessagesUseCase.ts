// @ts-nocheck
export class ListMessagesUseCase {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ userId } = {}) {
    const messages = await this.messageRepository.list();
    if (userId == null) return messages;
    return messages.filter((message) => String(message.userId) === String(userId));
  }
}
