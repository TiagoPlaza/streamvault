/**
 * seed.ts — Popula o banco com dados iniciais
 *
 * Rodado via: npm run db:seed
 * Usa tsx para executar TypeScript diretamente
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { initSchema } from '../src/lib/db-init';
import { createContent } from '../src/lib/content-repository';
import { MOCK_CONTENT } from '../src/lib/mockData';

// Setup manual para o script (fora do Next.js)
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'streamvault.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Override do singleton para o script
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
initSchema(db);

// Injeta o db no global para o repositório usar
(globalThis as unknown as { _db: Database.Database })._db = db;

// Usa MOCK_CONTENT como fonte única de dados para evitar duplicação.
// Apenas removemos os campos que são gerados pelo banco (id, createdAt, etc).
const SEED_DATA = MOCK_CONTENT.map(({ id, createdAt, updatedAt, ...item }) => item);

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Verifica se já tem dados
  const existing = db.prepare('SELECT COUNT(*) as n FROM content').get() as { n: number };
  if (existing.n > 0) {
    console.log(`⚠️  Banco já tem ${existing.n} registros.`);
    const answer = process.argv.includes('--force');
    if (!answer) {
      console.log('   Use --force para recriar os dados.');
      process.exit(0);
    }
    db.exec('DELETE FROM content');
    console.log('   Dados anteriores removidos.\n');
  }

  let count = 0;
  for (const item of SEED_DATA as any[]) {
    createContent(item);
    console.log(`   ✓ ${item.title}`);
    count++;
  }

  console.log(`\n✅ Seed concluído! ${count} títulos inseridos.`);
  console.log(`   Banco: ${DB_PATH}`);
  db.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
