import { randomUUID } from 'crypto';
import getDb from './db';
import type { Episode, VideoSource } from '@/types/content';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface DbRow {
  id: string;
  series_id: string;
  season: number;
  episode: number;
  title: string;
  description: string;
  duration: number | null;
  thumbnail: string;
  video_provider: string | null;
  video_id: string | null;
  release_date: string | null;
  opening_start: string | null;
  opening_end: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEpisode(row: DbRow): Episode {
  return {
    id: row.id,
    seriesId: row.series_id,
    season: row.season,
    episode: row.episode,
    title: row.title,
    description: row.description,
    duration: row.duration ?? 0,
    thumbnail: row.thumbnail,
    videoSource: row.video_provider && row.video_id
      ? { provider: row.video_provider as 'youtube' | 'vimeo', videoId: row.video_id }
      : { provider: 'youtube', videoId: '' },
    releaseDate: row.release_date ?? '',
    openingStart: row.opening_start ?? '',
    openingEnd: row.opening_end ?? '',
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

function ensureTable(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id              TEXT    PRIMARY KEY,
      series_id       TEXT    NOT NULL,
      season          INTEGER NOT NULL DEFAULT 1,
      episode         INTEGER NOT NULL DEFAULT 1,
      title           TEXT    NOT NULL,
      description     TEXT    NOT NULL DEFAULT '',
      duration        INTEGER,
      thumbnail       TEXT    NOT NULL DEFAULT '',
      video_provider  TEXT,
      video_id        TEXT,
      release_date    TEXT,
      opening_start   TEXT,
      opening_end     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(series_id, season, episode)
    );
    CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(series_id, season);
  `);
}

export function getEpisodesBySeriesId(seriesId: string): Episode[] {
  const db = getDb();
  ensureTable(db);
  const rows = db.prepare(`
    SELECT * FROM episodes
    WHERE series_id = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesId) as DbRow[];
  return rows.map(rowToEpisode);
}

export function getEpisodeById(id: string): Episode | null {
  const db = getDb();
  ensureTable(db);
  const row = db.prepare('SELECT * FROM episodes WHERE id = ?').get(id) as DbRow | undefined;
  return row ? rowToEpisode(row) : null;
}

export interface EpisodeInput {
  seriesId: string;
  season: number;
  episode: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  videoSource?: VideoSource;
  releaseDate?: string;
  openingStart?: string;
  openingEnd?: string;
}

export function createEpisode(data: EpisodeInput): Episode {
  const db = getDb();
  ensureTable(db);
  const id = randomUUID();

  db.prepare(`
    INSERT INTO episodes (
      id, series_id, season, episode, title, description,
      duration, thumbnail, video_provider, video_id, release_date, opening_start, opening_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.seriesId,
    data.season,
    data.episode,
    data.title.trim(),
    data.description?.trim() ?? '',
    data.duration ?? null,
    data.thumbnail?.trim() ?? '',
    data.videoSource?.provider ?? null,
    data.videoSource?.videoId ?? null,
    data.releaseDate || null,
    data.openingStart || null,
    data.openingEnd || null,
  );

  return getEpisodeById(id)!;
}

export function updateEpisode(id: string, data: Partial<EpisodeInput>): Episode | null {
  const db = getDb();
  ensureTable(db);

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.season     !== undefined) { fields.push('season = ?');          values.push(data.season); }
  if (data.episode    !== undefined) { fields.push('episode = ?');         values.push(data.episode); }
  if (data.title      !== undefined) { fields.push('title = ?');           values.push(data.title.trim()); }
  if (data.description!== undefined) { fields.push('description = ?');     values.push(data.description.trim()); }
  if (data.duration   !== undefined) { fields.push('duration = ?');        values.push(data.duration ?? null); }
  if (data.thumbnail  !== undefined) { fields.push('thumbnail = ?');       values.push(data.thumbnail.trim()); }
  if (data.releaseDate!== undefined) { fields.push('release_date = ?');    values.push(data.releaseDate || null); }
  if (data.videoSource!== undefined) {
    fields.push('video_provider = ?', 'video_id = ?');
    values.push(data.videoSource?.provider ?? null, data.videoSource?.videoId ?? null);
  }
  if (data.openingStart!== undefined) { fields.push('opening_start = ?');   values.push(data.openingStart || null); }
  if (data.openingEnd  !== undefined) { fields.push('opening_end = ?');     values.push(data.openingEnd || null); }

  if (fields.length === 0) return getEpisodeById(id);

  fields.push("updated_at = datetime('now')");
  db.prepare(`UPDATE episodes SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  return getEpisodeById(id);
}

export function deleteEpisode(id: string): boolean {
  const db = getDb();
  ensureTable(db);
  const result = db.prepare('DELETE FROM episodes WHERE id = ?').run(id);
  return result.changes > 0;
}

export function deleteAllEpisodes(seriesId: string): void {
  const db = getDb();
  ensureTable(db);
  db.prepare('DELETE FROM episodes WHERE series_id = ?').run(seriesId);
}

// Substitui todos os episódios de uma série de uma vez (usado no save do form)
export function replaceEpisodes(seriesId: string, episodes: Omit<EpisodeInput, 'seriesId'>[]): Episode[] {
  const db = getDb();
  ensureTable(db);

  const replace = db.transaction(() => {
    db.prepare('DELETE FROM episodes WHERE series_id = ?').run(seriesId);
    return episodes.map(ep => createEpisode({ ...ep, seriesId }));
  });

  return replace();
}