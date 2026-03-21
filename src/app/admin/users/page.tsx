'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/helpers';
import styles from './page.module.css';
import type { User, UserRole } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type AdminUser = User & { created_at: string };

export default function AdminUsersPage() {
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (!data.ok) throw new Error(data.error?.message || 'Falha ao carregar usuários');
        
        // Suporte à estrutura paginada: { success: true, data: { data: [...], pagination: ... } }
        // Se a API retornar paginação, os usuários estarão em data.data.data
        const userList = data.data.data || data.data || [];
        setUsers(userList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Atualiza o estado local para refletir a mudança
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação é irreversível.')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Remove o usuário do estado local
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading) return <div className={styles.page}><div>Carregando usuários...</div></div>;
  if (error) return <div className={styles.page}><div className={styles.error}>Erro: {error}</div></div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Gerenciamento de Usuários</h1>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Registrado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name || '-'}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`${styles.role} ${user.role === 'admin' ? styles.roleAdmin : ''}`}>
                    {user.role}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={user.id === currentUser?.id}
                      className={styles.selectRole}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUser?.id}
                      className={styles.deleteBtn}
                    >
                      Deletar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}