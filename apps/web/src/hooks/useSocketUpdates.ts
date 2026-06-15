import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';
import type { Drop, LatestPurchaser } from '../types/domain';

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

export function useSocketUpdates(queryClient: QueryClient) {
  useEffect(() => {
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('drop:stock-updated', (payload: { dropId: string; availableStock: number }) => {
      queryClient.setQueryData<Drop[]>(['drops'], (drops) =>
        drops?.map((drop) =>
          drop.id === payload.dropId ? { ...drop, availableStock: payload.availableStock } : drop
        )
      );
    });

    socket.on('drop:activity-updated', (payload: { dropId: string; latestPurchasers: LatestPurchaser[] }) => {
      queryClient.setQueryData<Drop[]>(['drops'], (drops) =>
        drops?.map((drop) =>
          drop.id === payload.dropId ? { ...drop, latestPurchasers: payload.latestPurchasers } : drop
        )
      );
    });

    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: ['drops'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
