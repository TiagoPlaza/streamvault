/**
 * content-repository.ts — Camada de acesso a dados
 *
 * Padrão Repository: isola o banco do resto da aplicação.
 * Faz a conversão entre o formato do banco (snake_case, JSON strings)
 * e o formato da aplicação (camelCase, arrays).
 */

import { randomUUID } from 'crypto';
import getDb from './db';
import type { ContentItem, ContentType, ContentStatus, ContentRating, VideoSource } from '@/types/content';

// ─── Tipos internos do banco ──────────────────────────────────────────────────

interface DbRow {
  id: string;
  type: string;
  title: string;
  original_title: string | null;
  description: string;
  long_description: string | null;
  year: number;
  duration: number | null;
  seasons: number | null;
  total_episodes: number | null;
  genres: string;
  rating: string;
  score: number;
  popularity: number;
  status: string;
  featured: number;
  thumbnail: string;
  backdrop: string;
  video_provider: string | null;
  video_id: string | null;
  cast: string;
  director: string | null;
  country: string;
  language: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

// ─── Conversores ──────────────────────────────────────────────────────────────

function rowToItem(row: DbRow): ContentItem {
  const videoSource: VideoSource | undefined =
    row.video_provider && row.video_id
      ? { provider: row.video_provider as 'youtube' | 'vimeo', videoId: row.video_id }
      : undefined;

  return {
    id: row.id,
    type: row.type as ContentType,
    title: row.title,
    originalTitle: row.original_title ?? undefined,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    year: row.year,
    duration: row.duration ?? undefined,
    seasons: row.seasons ?? undefined,
    totalEpisodes: row.total_episodes ?? undefined,
    genres: JSON.parse(row.genres) as string[],
    rating: row.rating as ContentRating,
    score: row.score,
    popularity: row.popularity,
    status: row.status as ContentStatus,
    featured: Boolean(row.featured),
    thumbnail: row.thumbnail,
    backdrop: row.backdrop,
    videoSource,
    cast: JSON.parse(row.cast) as string[],
    director: row.director ?? undefined,
    country: row.country,
    language: row.language,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export interface ListFilters {
  status?: string;
  type?: string;
  search?: string;
  genre?: string;
  orderBy?: 'score' | 'year' | 'popularity' | 'title' | 'created_at';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function listContent(filters: ListFilters = {}): { items: ContentItem[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];


  if (filters.status && filters.status !== 'all') {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.type && filters.type !== 'all') {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.genre) {
    // JSON contains check for genres array
    conditions.push("genres LIKE ?");
    params.push(`%"${filters.genre}"%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const orderMap: Record<string, string> = {
    score: 'score', year: 'year', popularity: 'popularity',
    title: 'title', created_at: 'created_at',
  };
  const col = orderMap[filters.orderBy ?? 'created_at'] ?? 'created_at';
  const dir = filters.order === 'asc' ? 'ASC' : 'DESC';

  const countStmt = db.prepare(`SELECT COUNT(*) as n FROM content ${where}`);
  const total = (countStmt.get(...params) as { n: number }).n;

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const stmt = db.prepare(
    `SELECT * FROM content ${where} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`
  );
  const rows = stmt.all(...params, limit, offset) as DbRow[];

  return { items: rows.map(rowToItem), total };
}

export function getContentById(id: string): ContentItem | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM content WHERE id = ?').get(id) as DbRow | undefined;
  return row ? rowToItem(row) : null;
}

export interface CreateContentData {
  type: ContentType;
  title: string;
  originalTitle?: string;
  description: string;
  longDescription?: string;
  year: number;
  duration?: number;
  seasons?: number;
  totalEpisodes?: number;
  genres: string[];
  rating: ContentRating;
  score: number;
  popularity?: number;
  status: ContentStatus;
  featured: boolean;
  thumbnail: string;
  backdrop: string;
  videoSource?: VideoSource;
  cast: string[];
  director?: string;
  country: string;
  language: string;
  tags: string[];
}

export function createContent(data: CreateContentData): ContentItem {
  const db = getDb();
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO content (
      id, type, title, original_title, description, long_description,
      year, duration, seasons, total_episodes, genres, rating, score,
      popularity, status, featured, thumbnail, backdrop,
      video_provider, video_id, cast, director, country, language, tags
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    id, data.type, data.title, data.originalTitle ?? null,
    data.description, data.longDescription ?? null,
    data.year, data.duration ?? null, data.seasons ?? null, data.totalEpisodes ?? null,
    JSON.stringify(data.genres), data.rating, data.score,
    data.popularity ?? 0, data.status, data.featured ? 1 : 0,
    data.thumbnail, data.backdrop,
    data.videoSource?.provider ?? null, data.videoSource?.videoId ?? null,
    JSON.stringify(data.cast), data.director ?? null,
    data.country, data.language, JSON.stringify(data.tags)
  );

  return getContentById(id)!;
}

export function updateContent(id: string, data: Partial<CreateContentData>): ContentItem | null {
  const db = getDb();
  const existing = getContentById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const map: Record<string, (v: unknown) => [string, string | number | null]> = {
    type:             v => ['type', v as string],
    title:            v => ['title', v as string],
    originalTitle:    v => ['original_title', (v as string | undefined) ?? null],
    description:      v => ['description', v as string],
    longDescription:  v => ['long_description', (v as string | undefined) ?? null],
    year:             v => ['year', v as number],
    duration:         v => ['duration', (v as number | undefined) ?? null],
    seasons:          v => ['seasons', (v as number | undefined) ?? null],
    totalEpisodes:    v => ['total_episodes', (v as number | undefined) ?? null],
    genres:           v => ['genres', JSON.stringify(v as string[])],
    rating:           v => ['rating', v as string],
    score:            v => ['score', v as number],
    popularity:       v => ['popularity', v as number],
    status:           v => ['status', v as string],
    featured:         v => ['featured', (v as boolean) ? 1 : 0],
    thumbnail:        v => ['thumbnail', v as string],
    backdrop:         v => ['backdrop', v as string],
    cast:             v => ['cast', JSON.stringify(v as string[])],
    director:         v => ['director', (v as string | undefined) ?? null],
    country:          v => ['country', v as string],
    language:         v => ['language', v as string],
    tags:             v => ['tags', JSON.stringify(v as string[])],
  };

  for (const [key, value] of Object.entries(data)) {
    if (key === 'videoSource') {
      const vs = value as VideoSource | undefined;
      fields.push('video_provider = ?', 'video_id = ?');
      values.push(vs?.provider ?? null, vs?.videoId ?? null);
      continue;
    }
    if (map[key]) {
      const [col, val] = map[key](value);
      fields.push(`${col} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return existing;

  db.prepare(
    `UPDATE content SET ${fields.join(', ')} WHERE id = ?`
  ).run(...values, id);

  return getContentById(id);
}

export function deleteContent(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM content WHERE id = ?').run(id);
  return result.changes > 0;
}

export function toggleFeatured(id: string): ContentItem | null {
  const db = getDb();
  db.prepare('UPDATE content SET featured = NOT featured WHERE id = ?').run(id);
  return getContentById(id);
}

export function toggleStatus(id: string): ContentItem | null {
  const db = getDb();
  db.prepare(`
    UPDATE content
    SET status = CASE WHEN status = 'published' THEN 'draft' ELSE 'published' END
    WHERE id = ?
  `).run(id);
  return getContentById(id);
}

export function getStats() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      COUNT(*)                                        AS total,
      SUM(status = 'published')                      AS published,
      SUM(status = 'draft')                          AS draft,
      SUM(status = 'archived')                       AS archived,
      SUM(type = 'movie')                            AS movies,
      SUM(type = 'series')                           AS series,
      SUM(featured)                                  AS featured,
      ROUND(AVG(score), 2)                           AS avg_score,
      SUM(popularity)                                AS total_views
    FROM content
  `).get() as Record<string, number>;

  return {
    total: rows.total,
    published: rows.published,
    draft: rows.draft,
    archived: rows.archived,
    movies: rows.movies,
    series: rows.series,
    featured: rows.featured,
    avgScore: rows.avg_score,
    totalViews: rows.total_views,
  };
}
