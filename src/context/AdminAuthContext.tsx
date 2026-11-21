import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError, adminApi, type AdminUser, type LeadershipRole } from '../services/cmsApi';

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  needsInitialSetup: boolean;
  requiresSetupToken: boolean;
  sessionNotice: string | null;
  authError: string | null;
  refreshSession: () => Promise<void>;
  setAuthenticatedUser: (user: AdminUser | null) => void;
  clearSessionNotice: () => void;
  login: (
    email: string,
    password: string,
    totpCode?: string
  ) => Promise<{ mfaRequired?: boolean; message?: string }>;
  setupInitialAdmin: (
    name: string,
    email: string,
    password: string,
    leadershipRole?: LeadershipRole,
    options?: {
      confirmPassword?: string;
      setupToken?: string;
      autoSignIn?: boolean;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  loading: true,
  needsInitialSetup: false,
  requiresSetupToken: false,
  sessionNotice: null,
  authError: null,
  refreshSession: async () => {},
  setAuthenticatedUser: () => {},
  clearSessionNotice: () => {},
  login: async () => ({}),
  setupInitialAdmin: async () => {},
  logout: async () => {},
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [requiresSetupToken, setRequiresSetupToken] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
    setAuthError(null);
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: AdminUser | null) => {
    setUser(nextUser);
    setSessionNotice(null);
    setAuthError(null);
    if (nextUser) {
      setNeedsInitialSetup(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const setup = await adminApi.getSetupStatus();
      setNeedsInitialSetup(setup.needsInitialSetup);
      setRequiresSetupToken(Boolean(setup.requiresSetupToken));

      if (setup.needsInitialSetup) {
        setUser(null);
        setAuthError(null);
        return;
      }

      const me = await adminApi.me();
      setUser(me.user);
      setSessionNotice(null);
      setAuthError(null);
    } catch (err) {
      setUser(null);
      if (err instanceof ApiError) {
        if (err.status === 401 && err.code === 'SESSION_EXPIRED') {
          setSessionNotice(err.message);
          setAuthError(null);
        } else if (err.status === 0 || err.status >= 500) {
          setAuthError(err.message);
        } else {
          setAuthError(null);
        }
      } else {
        setAuthError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string, totpCode?: string) => {
    const res = await adminApi.login({ email, password, totpCode });
    if (res.mfaRequired) {
      return { mfaRequired: true, message: res.message };
    }
    if (res.user) {
      setAuthenticatedUser(res.user);
    }
    return {};
  };

  const setupInitialAdmin = async (
    name: string,
    email: string,
    password: string,
    leadershipRole?: LeadershipRole,
    options?: {
      confirmPassword?: string;
      setupToken?: string;
      autoSignIn?: boolean;
    }
  ) => {
    const res = await adminApi.setupInitialAdmin({
      name,
      email,
      password,
      confirmPassword: options?.confirmPassword,
      leadershipRole,
      setupToken: options?.setupToken,
      autoSignIn: options?.autoSignIn,
    });
    setNeedsInitialSetup(false);
    if (options?.autoSignIn !== false) {
      setAuthenticatedUser(res.user);
    } else {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      setUser(null);
      setSessionNotice(null);
      setAuthError(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        needsInitialSetup,
        requiresSetupToken,
        sessionNotice,
        authError,
        refreshSession,
        setAuthenticatedUser,
        clearSessionNotice,
        login,
        setupInitialAdmin,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
