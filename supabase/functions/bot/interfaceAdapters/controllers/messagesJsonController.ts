// @ts-nocheck
export async function handleMessagesJson(listMessagesUseCase) {
  const messages = await listMessagesUseCase.execute();
  return Response.json(messages.slice().reverse());
}
