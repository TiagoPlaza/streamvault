/**
 * db.ts — Singleton do banco SQLite usando better-sqlite3
 *
 * better-sqlite3 é SÍNCRONO por design — ideal para Next.js API Routes
 * rodando em Node.js. Não use em Edge Runtime (use @libsql/client para isso).
 *
 * O singleton garante que apenas uma conexão seja aberta durante o
 * ciclo de vida do servidor (Hot Reload no dev cria nova instância via global).
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initSchema } from './db-init';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'streamvault.db');

// Garante que o diretório exista
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Padrão global para evitar múltiplas conexões no Hot Reload do Next.js dev
const globalForDb = globalThis as unknown as { _db: Database.Database | undefined };

function createConnection(): Database.Database {
  const db = new Database(DB_PATH, {
    // verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // WAL mode — melhor performance para leituras concorrentes
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Inicializa o schema se necessário
  initSchema(db);

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb._db) {
    globalForDb._db = createConnection();
  }
  return globalForDb._db;
}

export default getDb;
