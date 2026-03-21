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

  // Tabela para histórico de visualização
  db.exec(`
    CREATE TABLE IF NOT EXISTS watch_history (
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      seconds_watched INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, content_id)
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

export function getUsers(page: number = 1, limit: number = 10) {
  const db = getDb();
  initUserTable();
  
  const offset = (page - 1) * limit;

  const users = db.prepare(`
    SELECT id, email, role, name, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  return {
    data: users as (User & { created_at: string })[],
    total: total.count,
    totalPages: Math.ceil(total.count / limit)
  };
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

// --- Watch History ---

export function upsertWatchHistory(userId: string, contentId: string, seconds: number) {
  const db = getDb();
  initUserTable();
  
  const stmt = db.prepare(`
    INSERT INTO watch_history (user_id, content_id, seconds_watched, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, content_id) 
    DO UPDATE SET seconds_watched = excluded.seconds_watched, updated_at = CURRENT_TIMESTAMP
  `);
  
  return stmt.run(userId, contentId, seconds);
}

export function getWatchHistory(userId: string, contentId: string) {
  const db = getDb();
  initUserTable();
  return db.prepare('SELECT seconds_watched FROM watch_history WHERE user_id = ? AND content_id = ?').get(userId, contentId) as { seconds_watched: number } | undefined;
}