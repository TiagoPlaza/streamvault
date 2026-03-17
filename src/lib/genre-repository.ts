import getDb from './db';

export interface Genre {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  contentCount?: number;
}

interface DbRow {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  content_count?: number;
}

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function rowToGenre(row: DbRow): Genre {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    ...(row.content_count !== undefined && { contentCount: row.content_count }),
  };
}

function ensureTable(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      slug       TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
  `);
}

export function listGenres(): Genre[] {
  const db = getDb();
  ensureTable(db);
  // Conta quantos conteúdos usam cada gênero via LIKE no JSON
  const rows = db.prepare(`
    SELECT
      g.*,
      (SELECT COUNT(*) FROM content c WHERE c.genres LIKE '%"' || g.name || '"%') AS content_count
    FROM genres g
    ORDER BY g.slug ASC
  `).all() as DbRow[];
  return rows.map(rowToGenre);
}

export function getGenreById(id: number): Genre | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM genres WHERE id = ?').get(id) as DbRow | undefined;
  return row ? rowToGenre(row) : null;
}

export function getGenreNames(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT name FROM genres ORDER BY name ASC').all() as { name: string }[];
  return rows.map(r => r.name);
}

export function createGenre(name: string): Genre {
  const db = getDb();
  const trimmed = name.trim();

  // Verifica duplicata (case-insensitive via COLLATE NOCASE na tabela)
  const existing = db.prepare('SELECT id FROM genres WHERE name = ?').get(trimmed);
  if (existing) throw new Error(`Gênero "${trimmed}" já existe`);

  const slug = toSlug(trimmed);
  const result = db.prepare(
    'INSERT INTO genres (name, slug) VALUES (?, ?)'
  ).run(trimmed, slug);

  return getGenreById(result.lastInsertRowid as number)!;
}

export function updateGenre(id: number, name: string): Genre {
  const db = getDb();
  const trimmed = name.trim();

  // Verifica duplicata ignorando o próprio registro
  const existing = db.prepare('SELECT id FROM genres WHERE name = ? AND id != ?').get(trimmed, id);
  if (existing) throw new Error(`Gênero "${trimmed}" já existe`);

  const slug = toSlug(trimmed);
  const result = db.prepare(
    'UPDATE genres SET name = ?, slug = ? WHERE id = ?'
  ).run(trimmed, slug, id);

  if (result.changes === 0) throw new Error('Gênero não encontrado');

  // Atualiza nome nos conteúdos que usam este gênero
  // Busca o nome antigo para substituir no JSON
  const old = getGenreById(id);
  if (old) {
    const contents = db.prepare(
      `SELECT id, genres FROM content WHERE genres LIKE '%"' || ? || '"%'`
    ).all(old.name) as { id: string; genres: string }[];

    const updateContent = db.prepare('UPDATE content SET genres = ? WHERE id = ?');
    const updateMany = db.transaction(() => {
      for (const c of contents) {
        const genres: string[] = JSON.parse(c.genres);
        const updated = genres.map(g => g === old.name ? trimmed : g);
        updateContent.run(JSON.stringify(updated), c.id);
      }
    });
    updateMany();
  }

  return getGenreById(id)!;
}

export function deleteGenre(id: number): boolean {
  const db = getDb();
  const genre = getGenreById(id);
  if (!genre) return false;

  // Remove o gênero de todos os conteúdos que o usam
  const contents = db.prepare(
    `SELECT id, genres FROM content WHERE genres LIKE '%"' || ? || '"%'`
  ).all(genre.name) as { id: string; genres: string }[];

  const updateContent = db.prepare('UPDATE content SET genres = ? WHERE id = ?');
  const deleteAndClean = db.transaction(() => {
    for (const c of contents) {
      const genres: string[] = JSON.parse(c.genres);
      const updated = genres.filter(g => g !== genre.name);
      updateContent.run(JSON.stringify(updated), c.id);
    }
    db.prepare('DELETE FROM genres WHERE id = ?').run(id);
  });
  deleteAndClean();

  return true;
}

// Seed inicial — chamado pela rota /api/seed
export function seedGenres(names: string[]): void {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)'
  );
  const insertMany = db.transaction(() => {
    for (const name of names) {
      insert.run(name, toSlug(name));
    }
  });
  insertMany();
}
