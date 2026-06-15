const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api';
const dropId = process.env.DROP_ID;
const attempts = Number(process.env.ATTEMPTS ?? 100);

if (!dropId) {
  console.error('Set DROP_ID to the drop you want to stress test.');
  process.exit(1);
}

async function createUser(index: number) {
  const response = await fetch(`${apiUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `stress_${Date.now()}_${index}` })
  });

  if (!response.ok) {
    throw new Error(`Failed to create user ${index}`);
  }

  return response.json() as Promise<{ id: string }>;
}

async function reserve(userId: string) {
  const response = await fetch(`${apiUrl}/drops/${dropId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  return { ok: response.ok, status: response.status, body: await response.json() };
}

async function main() {
  const users = await Promise.all(Array.from({ length: attempts }, (_, index) => createUser(index)));
  const results = await Promise.all(users.map((user) => reserve(user.id)));
  const successes = results.filter((result) => result.ok).length;
  const failures = results.length - successes;

  console.log({ attempts, successes, failures });
  console.table(
    Object.entries(
      results.reduce<Record<string, number>>((acc, result) => {
        acc[result.status] = (acc[result.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }))
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
