import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';

export type LatestPurchaser = {
  username: string;
  purchasedAt: string;
};

let io: Server | undefined;

export function createSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.join('drops');
  });

  return io;
}

export function emitStockUpdated(payload: { dropId: string; availableStock: number }) {
  io?.to('drops').emit('drop:stock-updated', payload);
}

export function emitActivityUpdated(payload: { dropId: string; latestPurchasers: LatestPurchaser[] }) {
  io?.to('drops').emit('drop:activity-updated', payload);
}
