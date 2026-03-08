import { useState } from 'react';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../constants';
import { toErrorMessage } from '../utils/request';
import type { LoginResponse, LoginOtpRequiredResponse } from '../types/api';

export interface LoginProps {
  onLoggedIn: () => void;
}

export default function Login({ onLoggedIn }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post<LoginResponse | LoginOtpRequiredResponse>('/auth/login', {
        email: email.trim(),
        password,
      });
      const data = res.data;
      if ('token' in data && data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        onLoggedIn();
      } else if ('requiresOtp' in data && data.requiresOtp) {
        setError('OTP가 설정되어 있습니다. verify-otp API를 사용해 주세요.');
      } else {
        setError('로그인 응답에 토큰이 없습니다.');
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border border-zinc-700 rounded-xl bg-zinc-900">
      <h2 className="text-xl font-bold mb-2">로그인</h2>
      <p className="text-zinc-400 text-sm mb-4">Personal + Family AI</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="junhyukl@gmail.com"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-zinc-300 mb-1">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
