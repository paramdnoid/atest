import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';

import { apiGet } from '../lib/api';
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  verifyMfa as verifyMfaRequest,
  type LoginResult
} from '../lib/auth';
import { clearTokens, getUserId, setAccessToken, setUserId } from '../lib/storage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  userId: string | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfa: (userId: string, mfaToken: string, code: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

type OnboardingStatusResponse = {
  authenticated: boolean;
  userId: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveUserId(accessToken: string, fallbackUserId: string | null): Promise<string | null> {
  if (fallbackUserId) {
    return fallbackUserId;
  }

  try {
    const status = await apiGet<OnboardingStatusResponse>('/v1/onboarding/status', accessToken);
    return status.authenticated ? status.userId : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    accessToken: null,
    userId: null
  });

  const refresh = useCallback(async () => {
    const storedUserId = await getUserId();

    try {
      const nextAccessToken = await refreshSessionRequest();
      const nextUserId = await resolveUserId(nextAccessToken, storedUserId);

      await setAccessToken(nextAccessToken);
      if (nextUserId) {
        await setUserId(nextUserId);
      }

      setState({
        status: 'authenticated',
        accessToken: nextAccessToken,
        userId: nextUserId
      });
    } catch {
      await clearTokens();
      setState({
        status: 'unauthenticated',
        accessToken: null,
        userId: null
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);

    if (result.needsMfa) {
      return result;
    }

    await setAccessToken(result.accessToken);
    await setUserId(result.userId);

    setState({
      status: 'authenticated',
      accessToken: result.accessToken,
      userId: result.userId
    });

    return result;
  }, []);

  const verifyMfa = useCallback(async (userId: string, mfaToken: string, code: string) => {
    const result = await verifyMfaRequest(userId, mfaToken, code);

    await setAccessToken(result.accessToken);
    await setUserId(userId);

    setState({
      status: 'authenticated',
      accessToken: result.accessToken,
      userId
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      if (state.accessToken) {
        await logoutRequest(state.accessToken);
      } else {
        await clearTokens();
      }
    } finally {
      setState({
        status: 'unauthenticated',
        accessToken: null,
        userId: null
      });
    }
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      verifyMfa,
      refresh,
      logout
    }),
    [state, login, verifyMfa, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
