'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      // Login/Registro com sucesso
      router.push(callbackUrl);
      router.refresh(); // Atualiza componentes do servidor (navbar, etc)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h1 className={styles.title}>{isRegister ? 'Criar Conta' : 'Acesso Admin'}</h1>
          
          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {isRegister && (
              <div className={styles.field}>
                <label>Nome</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div className={styles.field}>
              <label>E-mail</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className={styles.field}>
              <label>Senha</label>
              <input 
                type="password" 
                required 
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Processando...' : (isRegister ? 'Cadastrar' : 'Entrar')}
            </button>
          </form>

          <button 
            className={styles.switchBtn} 
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister 
              ? 'Já tem conta? Faça login' 
              : 'Primeiro acesso? Cadastre-se (1º usuário será Admin)'}
          </button>
        </div>
      </div>
    </div>
  );
}