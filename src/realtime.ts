type RealtimeClient = {
  id: string;
  tenantId: string;
  userId: string;
  send: (event: { type: string; tenantId: string; userId?: string }) => void;
};

const clients = new Map<string, RealtimeClient>();

export function addRealtimeClient(client: RealtimeClient): void {
  clients.set(client.id, client);
}

export function removeRealtimeClient(clientId: string): void {
  clients.delete(clientId);
}

export function publishRealtimeEvent(event: { type: string; tenantId: string; userId?: string }): void {
  for (const client of clients.values()) {
    if (client.tenantId !== event.tenantId) continue;
    if (event.userId && client.userId !== event.userId) continue;
    client.send(event);
  }
}
