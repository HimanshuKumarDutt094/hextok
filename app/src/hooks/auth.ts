import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchUser() {
  const res = await fetch('https://jsonplaceholder.typicode.com/users/1');
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    isLoading,
    isError,
    error,
    data: session,
  } = useQuery({
    queryKey: ['authUser'],
    queryFn: fetchUser,
    retry: false, // don't spam when unauthenticated
  });

  const login = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] }),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch('/api/logout', { method: 'POST' });
    },
    onSuccess: () => queryClient.setQueryData(['authUser'], null),
  });

  return { isLoading, isError, error, session, login, logout };
}
