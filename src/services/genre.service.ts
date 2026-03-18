import getDb from '@/lib/db';

interface Genre {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  contentCount: number;
}

/**
 * Lista todos os gêneros, incluindo a contagem de conteúdos associados.
 */
export function listGenres(): Genre[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      g.id,
      g.name,
      g.slug,
      g.created_at AS createdAt,
      COUNT(DISTINCT c.id) AS contentCount
    FROM genres g
    LEFT JOIN content c ON INSTR(c.genres, g.name) > 0
    GROUP BY g.id, g.name, g.slug, g.created_at
    ORDER BY g.name COLLATE NOCASE
  `).all() as Genre[];
  return rows;
}

/**
 * Cria um novo gênero.
 */
export function createGenre(name: string): Omit<Genre, 'contentCount'> {
  const db = getDb();
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stmt = db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)');
  const info = stmt.run(name, slug);
  return db.prepare('SELECT id, name, slug, created_at AS createdAt FROM genres WHERE id = ?').get(info.lastInsertRowid) as Omit<Genre, 'contentCount'>;
}

/**
 * Atualiza um gênero existente.
 */
export function updateGenre(id: number, name: string): Omit<Genre, 'contentCount'> | null {
  const db = getDb();
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stmt = db.prepare('UPDATE genres SET name = ?, slug = ? WHERE id = ?');
  const info = stmt.run(name, slug, id);
  if (info.changes === 0) return null;
  return db.prepare('SELECT id, name, slug, created_at AS createdAt FROM genres WHERE id = ?').get(id) as Omit<Genre, 'contentCount'>;
}

export function deleteGenre(id: number): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM genres WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}