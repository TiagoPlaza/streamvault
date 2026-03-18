import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { User, UserRole } from './auth';

export function initUserTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function createUser(email: string, password: string, name?: string) {
  const db = getDb();
  initUserTable();

  // Verifica se já existe algum usuário. Se não, o primeiro será ADMIN.
  const count = db.prepare('SELECT COUNT(*) as total FROM users').get() as { total: number };
  const role: UserRole = count.total === 0 ? 'admin' : 'user';

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email, hashedPassword, role, name);
    return { id, email, role, name };
  } catch (error) {
    // Provavelmente e-mail duplicado
    return null;
  }
}

export async function validateUser(email: string, password: string) {
  const db = getDb();
  initUserTable(); // Garante que a tabela existe

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (user && await bcrypt.compare(password, user.password_hash)) {
    // Retorna o usuário sem o hash da senha
    const { password_hash, ...safeUser } = user;
    return safeUser as User;
  }
  return null;
}

export function getUsers() {
  const db = getDb();
  initUserTable();
  // Retorna todos os usuários sem o hash da senha, ordenados por data de criação
  const users = db.prepare('SELECT id, email, role, name, created_at FROM users ORDER BY created_at DESC').all();
  return users as (User & { created_at: string })[];
}

export function updateUserRole(userId: string, newRole: UserRole) {
  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
  // Retorna true se uma linha foi afetada
  return result.changes > 0;
}

export function deleteUser(userId: string) {
  const db = getDb();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return result.changes > 0;
}