// @ts-nocheck
import { renderMiniAppHtml } from "../presenters/miniAppHtmlPresenter.ts";
import { verifyTelegramInitData } from "../../infrastructure/security/verifyTelegramInitData.ts";

export function handleMiniAppPage(basePath) {
  return new Response(renderMiniAppHtml(basePath), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function handleRatesJson(getLiveRatesUseCase) {
  const rates = await getLiveRatesUseCase.execute();
  return Response.json(rates);
}

export async function handleMyMessagesJson(url, listMessagesUseCase, botToken) {
  const initData = url.searchParams.get("initData");
  const user = await verifyTelegramInitData(initData, botToken);
  if (!user) {
    return Response.json({ error: "invalid or missing initData" }, { status: 401 });
  }

  const messages = await listMessagesUseCase.execute({ userId: user.id });
  return Response.json(messages.slice().reverse());
}
