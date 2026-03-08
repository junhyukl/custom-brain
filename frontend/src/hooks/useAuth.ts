import { useState, useCallback, useEffect } from 'react';
import { AUTH_TOKEN_KEY } from '../constants';
import { AUTH_LOGOUT_EVENT } from '../api/axios';

function readIsLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(readIsLoggedIn);

  const handleLoggedIn = useCallback(() => setIsLoggedIn(true), []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    const onLogout = () => setIsLoggedIn(false);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  return { isLoggedIn, handleLoggedIn, logout };
}
