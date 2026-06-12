import { Response } from "express";
import { logger } from "@/utils";

interface SSEClient {
  id: string;
  res: Response;
}

class SSEBroker {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response): void {
    this.clients.set(id, { id, res });
    logger.log("SSE", `Client connected: ${id} (total: ${this.clients.size})`);
  }

  removeClient(id: string): void {
    this.clients.delete(id);
    logger.log("SSE", `Client disconnected: ${id} (total: ${this.clients.size})`);
  }

  broadcast(payload: { event: string; data: unknown }): void {
    const message = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
    logger.log("SSE", `Job broadcast ${payload.event}`);
    for (const client of this.clients.values()) {
      try {
        client.res.write(message);
      } catch {
        this.removeClient(client.id);
      }
    }
  }
}

export const sseBroker = new SSEBroker();
