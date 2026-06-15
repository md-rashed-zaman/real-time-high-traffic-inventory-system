import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDrops, upsertUser } from '../api/client';
import { DropCard } from '../components/DropCard';
import { useSocketUpdates } from '../hooks/useSocketUpdates';
import type { Drop, User } from '../types/domain';

export function Dashboard() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('alex');
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  useSocketUpdates(queryClient);

  const dropsQuery = useQuery({
    queryKey: ['drops'],
    queryFn: fetchDrops
  });

  function showMessage(text: string, tone: 'success' | 'error' = 'success') {
    setMessage({ text, tone });
    window.setTimeout(() => setMessage(null), 3500);
  }

  async function handleUserSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSavingUser(true);

    try {
      const nextUser = await upsertUser(username);
      setUser(nextUser);
      showMessage(`Using username ${nextUser.username}.`, 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Could not save user.', 'error');
    } finally {
      setIsSavingUser(false);
    }
  }

  function handleLocalStockUpdate(dropId: string, availableStock: number) {
    queryClient.setQueryData<Drop[]>(['drops'], (drops) =>
      drops?.map((drop) => (drop.id === dropId ? { ...drop, availableStock } : drop))
    );
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Realtime release control</p>
          <h1>Limited Edition Sneaker Drop</h1>
          <p>
            Reserve inventory for 60 seconds, complete checkout, and watch stock synchronize across every
            connected browser window.
          </p>
        </div>

        <form className="user-form" onSubmit={handleUserSubmit}>
          <label htmlFor="username">Demo username</label>
          <div>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            <button disabled={isSavingUser}>{isSavingUser ? 'Saving...' : 'Use'}</button>
          </div>
          {user ? <small>Active user: {user.username}</small> : <small>Pick a user before reserving.</small>}
        </form>
      </header>

      {message ? <div className={`toast toast--${message.tone}`}>{message.text}</div> : null}

      {dropsQuery.isLoading ? <p className="state">Loading drops...</p> : null}
      {dropsQuery.isError ? <p className="state state--error">Could not load drops.</p> : null}

      <section className="grid">
        {dropsQuery.data?.map((drop) => (
          <DropCard
            key={drop.id}
            drop={drop}
            user={user}
            onMessage={showMessage}
            onLocalStockUpdate={handleLocalStockUpdate}
            onPurchased={() => queryClient.invalidateQueries({ queryKey: ['drops'] })}
          />
        ))}
      </section>
    </main>
  );
}
