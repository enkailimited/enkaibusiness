import "server-only";

interface SSEClient {
  userId: string;
  encoder: TextEncoder;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  connectedAt: Date;
}

const clients = new Map<string, Map<string, SSEClient>>();

function businessKey(businessId: string): string {
  return businessId;
}

export function addClient(
  businessId: string,
  userId: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
): void {
  const key = businessKey(businessId);
  if (!clients.has(key)) clients.set(key, new Map());
  clients.get(key)!.set(userId, { userId, encoder: new TextEncoder(), writer, connectedAt: new Date() });
}

export function removeClient(businessId: string, userId: string): void {
  const key = businessKey(businessId);
  clients.get(key)?.delete(userId);
  if (clients.get(key)?.size === 0) clients.delete(key);
}

export function sendToUser(businessId: string, userId: string, event: string, data: unknown): void {
  const client = clients.get(businessKey(businessId))?.get(userId);
  if (!client) return;
  sendEvent(client, event, data);
}

export function broadcast(businessId: string, event: string, data: unknown): void {
  const businessClients = clients.get(businessKey(businessId));
  if (!businessClients) return;
  for (const client of businessClients.values()) {
    sendEvent(client, event, data);
  }
}

function sendEvent(client: SSEClient, event: string, data: unknown): void {
  try {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    client.writer.write(client.encoder.encode(message)).catch(() => {});
  } catch {
    // Connection likely closed
  }
}

export function getConnectedCount(): number {
  let count = 0;
  for (const businessClients of clients.values()) {
    count += businessClients.size;
  }
  return count;
}
