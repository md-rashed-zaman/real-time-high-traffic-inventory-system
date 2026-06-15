import { useEffect, useState } from 'react';

export function useCountdown(expiresAt?: string) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return;
    }

    const update = () => {
      setRemainingMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    };

    update();
    const interval = setInterval(update, 250);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return Math.ceil(remainingMs / 1000);
}
