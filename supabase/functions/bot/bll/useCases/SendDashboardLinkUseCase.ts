// @ts-nocheck
// Replies with a button that opens the Mini App dashboard (live rates and the
// user's query history).
export class SendDashboardLinkUseCase {
  constructor(messengerGateway) {
    this.messengerGateway = messengerGateway;
  }

  // dashboardUrl depends on the request's origin, so the caller passes it in
  async execute({ chatId, dashboardUrl }) {
    await this.messengerGateway.sendMessage(chatId, "Open your live rates and query history:", {
      inline_keyboard: [[{ text: "📊 Open Dashboard", web_app: { url: dashboardUrl } }]],
    });
  }
}
