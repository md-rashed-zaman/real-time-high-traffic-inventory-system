export type LatestPurchaser = {
  username: string;
  purchasedAt: string;
};

export type Drop = {
  id: string;
  name: string;
  totalStock: number;
  availableStock: number;
  startsAt: string;
  endsAt: string | null;
  latestPurchasers: LatestPurchaser[];
};

export type User = {
  id: string;
  username: string;
};

export type Reservation = {
  reservationId: string;
  expiresAt: string;
};
