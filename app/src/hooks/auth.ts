import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { API_BASE } from '../config';

// Types for auth responses
interface User {
  id: number;
  userName: string;
}

interface LoginResponse {
  token: string;
  expiresIn: number;
  userId: number;
  sessionId: number;
}

const AUTH_TOKEN_KEY = 'hextok_auth_token';

// Fetch current user profile using stored token
async function fetchUser(token: string | null): Promise<User | null> {
  'background only';

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid, remove it
      throw new Error('Authentication token expired');
    }
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const localStorage = useLocalStorage();

  // Query for stored auth token
  const { data: authToken, isLoading: isTokenLoading } = useQuery({
    queryKey: ['authToken'],
    queryFn: () => localStorage.getItem(AUTH_TOKEN_KEY),
    staleTime: Infinity, // Token doesn't become stale
  });

  // Query for user profile using the token
  const {
    isLoading: isUserLoading,
    isError,
    error,
    data: session,
  } = useQuery({
    queryKey: ['authUser', authToken],
    queryFn: () => fetchUser(authToken || null),
    enabled: !!authToken, // Only run when we have a token
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (invalid token)
      if (error.message.includes('Authentication token expired')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Handle token invalidation when user query fails
  const handleTokenInvalidation = async () => {
    'background only';

    await localStorage.removeItem(AUTH_TOKEN_KEY);
    queryClient.setQueryData(['authToken'], null);
  };

  // Check if we need to invalidate token on error
  if (isError && error?.message.includes('Authentication token expired')) {
    handleTokenInvalidation().catch(console.error);
  }

  // Store authentication token
  const storeToken = useMutation({
    mutationFn: async (loginResponse: LoginResponse) => {
      await localStorage.setItem(AUTH_TOKEN_KEY, loginResponse.token);
      return loginResponse;
    },
    onSuccess: (loginResponse) => {
      // Update the token query cache
      queryClient.setQueryData(['authToken'], loginResponse.token);
      // Invalidate user query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });

  // OAuth login mutation - simplified to just do token exchange
  const login = useMutation({
    mutationFn: async (mobileToken: string) => {
      const response = await fetch(`${API_BASE}/api/v1/oauth/mobile/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: mobileToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }

      const loginResponse: LoginResponse = await response.json();
      return loginResponse;
    },
    onSuccess: (loginResponse) => {
      // Store the token
      storeToken.mutate(loginResponse);
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      'background only';

      const token = await localStorage.getItem(AUTH_TOKEN_KEY);

      // Call logout endpoint if we have a token
      if (token) {
        try {
          await fetch(`${API_BASE}/api/v1/oauth/logout`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          // Continue with logout even if server call fails
          console.warn('Server logout failed:', error);
        }
      }

      // Remove token from local storage
      await localStorage.removeItem(AUTH_TOKEN_KEY);
    },
    onSuccess: () => {
      // Clear all auth-related query cache
      queryClient.setQueryData(['authToken'], null);
      queryClient.setQueryData(['authUser'], null);
      queryClient.invalidateQueries({ queryKey: ['authToken'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });

  const isLoading = isTokenLoading || isUserLoading;
  const isAuthenticated = !!authToken && !!session && !isError;

  return {
    isLoading,
    isError,
    error,
    session,
    isAuthenticated,
    authToken,
    login,
    logout,
    storeToken,
  };
}
