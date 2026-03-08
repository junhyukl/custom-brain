import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../constants';
import { AUTH_LOGOUT_EVENT } from '../api/axios';
import type { CurrentUser } from '../types/api';

function readIsLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(readIsLoggedIn);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const handleLoggedIn = useCallback(() => setIsLoggedIn(true), []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser(null);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUser(null);
      return;
    }
    axios
      .get<CurrentUser>('/auth/me')
      .then((res) => setCurrentUser(res.data))
      .catch(() => setCurrentUser(null));
  }, [isLoggedIn]);

  return { isLoggedIn, currentUser, handleLoggedIn, logout };
}
