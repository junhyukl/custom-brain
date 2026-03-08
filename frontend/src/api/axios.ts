import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../constants';

const AUTH_LOGOUT_EVENT = 'auth:logout';

/**
 * Attach auth (JWT or API key) to outgoing requests and clear token on 401.
 * Call once from main.tsx before rendering.
 */
export function setupAxios(): void {
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

  axios.interceptors.request.use((config) => {
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (apiKey?.trim()) {
      config.headers.set('X-API-Key', apiKey.trim());
    } else if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        }
      }
      return Promise.reject(err);
    },
  );
}

export { AUTH_LOGOUT_EVENT };
