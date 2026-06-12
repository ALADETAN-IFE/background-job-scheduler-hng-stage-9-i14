import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sseBroker } from "@/sse";
import { logger } from "@/utils";

export const getEvents = (req: Request, res: Response) => {
  const clientId = uuidv4();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  sseBroker.addClient(clientId, res);

  logger.log("SSE", `Client connected to SSE: ${clientId}`);

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseBroker.removeClient(clientId);
  });
};
