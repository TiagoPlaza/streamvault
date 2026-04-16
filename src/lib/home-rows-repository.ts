import getDb from './db';

export interface HomeRow {
  id: number;
  title: string;
  filterType: string;
  filterValue: string | null;
  sortBy: string;
  contentLimit: number;
  position: number;
  active: boolean;
  rowType: 'standard' | 'top10';
  metadata?:  {
    period?: 'day' | 'week' | 'month' | 'all_time';
    genreId?: string;
    type?: 'movie' | 'series' | 'both';
  };
  createdAt: string;
}

interface DbRow {
  id: number;
  title: string;
  filter_type: string;
  filter_value: string | null;
  sort_by: string;
  content_limit: number;
  position: number;
  active: number;
  row_type: string;
  metadata?:  {
    period?: 'day' | 'week' | 'month' | 'all_time';
    genreId?: string;
    type?: 'movie' | 'series' | 'both';
  };
  created_at: string;
}

function toHomeRow(r: DbRow): HomeRow {
  return {
    id: r.id, title: r.title,
    filterType: r.filter_type, filterValue: r.filter_value,
    sortBy: r.sort_by, contentLimit: r.content_limit,
    position: r.position, active: Boolean(r.active),
    rowType: r.row_type as 'standard' | 'top10',
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    createdAt: r.created_at,
  };
}

function ensureTable(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS home_rows (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      filter_type   TEXT    NOT NULL DEFAULT 'genre',
      filter_value  TEXT,
      sort_by       TEXT    NOT NULL DEFAULT 'popularity',
      content_limit INTEGER NOT NULL DEFAULT 20,
      position      INTEGER NOT NULL DEFAULT 0,
      active        INTEGER NOT NULL DEFAULT 1,
      row_type      TEXT    NOT NULL DEFAULT 'standard',
      metadata      TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_home_rows_position ON home_rows(position);
  `);
}

export function listHomeRows(onlyActive = true): HomeRow[] {
  const db = getDb();
  ensureTable(db);
  const where = onlyActive ? 'WHERE active = 1' : '';
  const rows = db.prepare(
    `SELECT * FROM home_rows ${where} ORDER BY position ASC`
  ).all() as DbRow[];
  return rows.map(toHomeRow);
}

export function getHomeRowById(id: number): HomeRow | null {
  const db = getDb();
  const r = db.prepare('SELECT * FROM home_rows WHERE id = ?').get(id) as DbRow | undefined;
  return r ? toHomeRow(r) : null;
}

export interface HomeRowInput {
  title: string;
  filterType: string;
  filterValue?: string;
  sortBy?: string;
  contentLimit?: number;
  position?: number;
  active?: boolean;
  rowType?: 'standard' | 'top10';
  metadata?:  {
    period?: 'day' | 'week' | 'month' | 'all_time';
    genreId?: string;
    type?: 'movie' | 'series' | 'both';
  };
}

export function createHomeRow(data: HomeRowInput): HomeRow {
  const db = getDb();
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM home_rows').get() as { m: number | null }).m ?? 0;
  const result = db.prepare(`
    INSERT INTO home_rows (title, filter_type, filter_value, sort_by, content_limit, position, active, row_type, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.filterType,
    data.filterValue ?? null,
    data.sortBy ?? 'popularity',
    data.contentLimit ?? 20,
    data.position ?? maxPos + 1,
    data.active !== false ? 1 : 0,
    data.rowType ?? 'standard',
    JSON.stringify(data.metadata ?? {}),
  );
  return getHomeRowById(result.lastInsertRowid as number)!;
}

export function updateHomeRow(id: number, data: Partial<HomeRowInput>): HomeRow | null {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (data.title       !== undefined) { fields.push('title = ?');          values.push(data.title); }
  if (data.filterType  !== undefined) { fields.push('filter_type = ?');    values.push(data.filterType); }
  if (data.filterValue !== undefined) { fields.push('filter_value = ?');   values.push(data.filterValue ?? null); }
  if (data.sortBy      !== undefined) { fields.push('sort_by = ?');        values.push(data.sortBy); }
  if (data.contentLimit!== undefined) { fields.push('content_limit = ?');  values.push(data.contentLimit); }
  if (data.position    !== undefined) { fields.push('position = ?');       values.push(data.position); }
  if (data.active      !== undefined) { fields.push('active = ?');         values.push(data.active ? 1 : 0); }
  if (data.rowType     !== undefined) { fields.push('row_type = ?');       values.push(data.rowType); }
  if (data.metadata    !== undefined) { fields.push('metadata = ?');       values.push(JSON.stringify(data.metadata || {})); }
  if (!fields.length) return getHomeRowById(id);
  db.prepare(`UPDATE home_rows SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  return getHomeRowById(id);
}

export function deleteHomeRow(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM home_rows WHERE id = ?').run(id).changes > 0;
}

export function reorderHomeRows(ids: number[]): void {
  const db = getDb();
  const update = db.prepare('UPDATE home_rows SET position = ? WHERE id = ?');
  db.transaction(() => ids.forEach((id, i) => update.run(i + 1, id)))();
}