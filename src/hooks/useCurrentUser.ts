import { useState, useEffect } from 'react';
import type { User } from '@/lib/auth';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          // A estrutura de resposta é { ok: true, data: User }
          if (json.ok && json.data) {
            setUser(json.data);
          }
        }
      })
      .catch((err) => console.error('Erro ao buscar sessão:', err))
      .finally(() => setLoading(false));
  }, []);

  // Helpers de permissão
  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    isAdmin
  };
}