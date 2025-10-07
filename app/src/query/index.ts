export const queryKeys = {
  users: ['users'] as const,
  hexColors: ['hexColors'] as const,
  userId: (id: string) => ['users', id] as const,
  hexId: (id: string) => ['hexColors', id] as const,
};

export async function fetcher<T>(
  url: string,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Note: Authentication should be handled by the auth hook, not here
      // The bearer token will be added by the specific query hooks that need it
    },
    ...init,
  });
  // 204 No Content -> return undefined typed as T
  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : null) ||
      res.statusText ||
      'Fetch error';
    const error = new Error(String(message)) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// Authenticated fetcher that accepts a token
export async function authenticatedFetcher<T>(
  url: string,
  token: string,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  return fetcher<T>(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
