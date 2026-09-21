// @ts-nocheck
import { renderMessagesHtml } from "../presenters/messagesHtmlPresenter.ts";

export async function handleMessagesPage(listMessagesUseCase, basePath) {
  const messages = await listMessagesUseCase.execute();
  return new Response(renderMessagesHtml(messages, basePath), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
