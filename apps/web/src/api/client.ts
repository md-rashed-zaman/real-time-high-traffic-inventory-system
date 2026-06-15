import type { Drop, Reservation, User } from '../types/domain';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message ?? 'Request failed');
  }

  return body as T;
}

export function fetchDrops() {
  return request<Drop[]>('/drops');
}

export function upsertUser(username: string) {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ username })
  });
}

export function reserveDrop(dropId: string, userId: string) {
  return request<Reservation & { availableStock: number }>(`/drops/${dropId}/reserve`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export function completePurchase(reservationId: string, userId: string) {
  return request<{ purchaseId: string }>(`/reservations/${reservationId}/purchase`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}
