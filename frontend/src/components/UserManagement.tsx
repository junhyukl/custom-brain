import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toErrorMessage } from '../utils/request';
import type { AdminUser } from '../types/api';

const ROLES: AdminUser['role'][] = ['admin', 'manager', 'user'];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export interface UserManagementProps {
  currentUserId?: string;
}

export default function UserManagement(props: UserManagementProps) {
  const { currentUserId } = props;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<AdminUser['role']>('user');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    axios
      .get<AdminUser[]>('/auth/admin/users')
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(toErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setRole = useCallback((userId: string, role: AdminUser['role']) => {
    setUpdatingId(userId);
    axios
      .patch(`/auth/admin/users/${userId}/role`, { role })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u)),
        );
      })
      .catch(() => {
        setUpdatingId(null);
      })
      .finally(() => {
        setUpdatingId(null);
      });
  }, []);

  const submitAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setAddError(null);
      setAddSubmitting(true);
      axios
        .post<{ id: string; email: string; role: AdminUser['role'] }>(
          '/auth/admin/users',
          { email: addEmail.trim(), password: addPassword, role: addRole },
        )
        .then(() => {
          setAddEmail('');
          setAddPassword('');
          setAddRole('user');
          setShowAddForm(false);
          fetchUsers();
        })
        .catch((err) => setAddError(toErrorMessage(err)))
        .finally(() => setAddSubmitting(false));
    },
    [addEmail, addPassword, addRole, fetchUsers],
  );

  const deleteUser = useCallback(
    (userId: string) => {
      setDeletingId(userId);
      axios
        .delete(`/auth/admin/users/${userId}`)
        .then(() => {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          setDeleteConfirmId(null);
        })
        .catch(() => setDeletingId(null))
        .finally(() => setDeletingId(null));
    },
    [],
  );

  if (loading) {
    return (
      <section className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold mb-2">사용자 관리</h2>
        <p className="text-zinc-500 text-sm">불러오는 중…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold mb-2">사용자 관리</h2>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchUsers}
          className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-700 text-sm hover:bg-zinc-600"
        >
          다시 시도
        </button>
      </section>
    );
  }

  return (
    <section className="p-4 border-b border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">사용자 관리</h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            사용자 추가 · 역할 변경 · 삭제 (admin 전용)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setAddError(null);
            setAddEmail('');
            setAddPassword('');
            setAddRole('user');
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
        >
          사용자 추가
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border border-zinc-700 rounded-xl bg-zinc-900">
          <h3 className="font-medium mb-3">새 사용자</h3>
          <form onSubmit={submitAdd} className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">이메일</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">비밀번호</label>
              <input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">역할</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as AdminUser['role'])}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {addError && (
              <p className="text-red-400 text-sm">{addError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm disabled:opacity-50"
              >
                {addSubmitting ? '추가 중…' : '추가'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddError(null);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-zinc-700">
          <thead>
            <tr className="bg-zinc-800">
              <th className="text-left p-3 border-b border-zinc-700">이메일</th>
              <th className="text-left p-3 border-b border-zinc-700">역할</th>
              <th className="text-left p-3 border-b border-zinc-700">가입일</th>
              <th className="text-left p-3 border-b border-zinc-700 w-24">삭제</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800">
                <td className="p-3 text-zinc-200">{user.email}</td>
                <td className="p-3">
                  <select
                    value={user.role}
                    disabled={updatingId === user.id}
                    onChange={(e) =>
                      setRole(user.id, e.target.value as AdminUser['role'])
                    }
                    className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-zinc-500">{formatDate(user.createdAt)}</td>
                <td className="p-3">
                  {deleteConfirmId === user.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        disabled={deletingId === user.id}
                        className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                      >
                        {deletingId === user.id ? '삭제 중…' : '확인'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-zinc-400 hover:text-zinc-300 text-xs"
                      >
                        취소
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(user.id)}
                      disabled={user.id === currentUserId}
                      title={
                        user.id === currentUserId
                          ? '자기 자신은 삭제할 수 없습니다'
                          : '삭제'
                      }
                      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !showAddForm && (
        <p className="text-zinc-500 text-sm mt-4">등록된 사용자가 없습니다.</p>
      )}
    </section>
  );
}
