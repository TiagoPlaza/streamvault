/**
 * personalization.ts
 *
 * Motor de personalização: resolve quais conteúdos mostrar em cada linha
 * com base no perfil do usuário (histórico, gêneros, horário).
 */

import getDb from './db';
import type { ContentItem } from '@/types/content';
import type { HomeRow } from './home-rows-repository';

// ─── Histórico de visualização ────────────────────────────────────────────────

export interface WatchEvent {
  contentId: string;
  episodeId?: string;
  secondsWatched: number;
  completed?: boolean;
}

export function recordWatch(userId: string, event: WatchEvent): void {
  const db = getDb();
  const hour = new Date().getHours();

  // Upsert no histórico
  db.prepare(`
    INSERT INTO viewing_history (user_id, content_id, episode_id, seconds_watched, completed, hour_of_day, last_watched_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, content_id, episode_id) DO UPDATE SET
      seconds_watched = seconds_watched + excluded.seconds_watched,
      completed       = CASE WHEN excluded.completed = 1 THEN 1 ELSE completed END,
      last_watched_at = excluded.last_watched_at,
      hour_of_day     = excluded.hour_of_day
  `).run(
    userId,
    event.contentId,
    event.episodeId ?? null,
    event.secondsWatched,
    event.completed ? 1 : 0,
    hour,
  );

  // Atualiza preferências de gênero e horário
  updatePreferences(userId, event.contentId, hour, event.secondsWatched);
}

function updatePreferences(userId: string, contentId: string, hour: number, seconds: number): void {
  const db = getDb();

  // Busca gêneros do conteúdo
  const row = db.prepare('SELECT genres FROM content WHERE id = ?').get(contentId) as { genres: string } | undefined;
  if (!row) return;

  const genres: string[] = JSON.parse(row.genres);
  const minutes = Math.round(seconds / 60);

  // Busca ou cria preferências
  let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as {
    user_id: string; genre_scores: string; usage_hours: string; total_watched: number;
  } | undefined;

  if (!prefs) {
    db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(userId);
    prefs = { user_id: userId, genre_scores: '{}', usage_hours: '{}', total_watched: 0 };
  }

  const genreScores: Record<string, number> = JSON.parse(prefs.genre_scores);
  const usageHours: Record<string, number>  = JSON.parse(prefs.usage_hours);

  // Incrementa score de cada gênero proporcionalmente ao tempo assistido
  for (const g of genres) {
    genreScores[g] = (genreScores[g] ?? 0) + Math.max(1, minutes);
  }

  // Registra minutos por hora do dia
  usageHours[String(hour)] = (usageHours[String(hour)] ?? 0) + minutes;

  db.prepare(`
    UPDATE user_preferences
    SET genre_scores = ?, usage_hours = ?, total_watched = total_watched + ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(JSON.stringify(genreScores), JSON.stringify(usageHours), minutes, userId);
}

export function getUserHistory(userId: string): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT content_id FROM viewing_history
    WHERE user_id = ?
    ORDER BY last_watched_at DESC
    LIMIT 50
  `).all(userId) as { content_id: string }[];
  return rows.map(r => r.content_id);
}

export function getUserPreferences(userId: string): {
  genreScores: Record<string, number>;
  usageHours: Record<string, number>;
  topGenres: string[];
  peakHour: number;
} {
  const db = getDb();
  const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as {
    genre_scores: string; usage_hours: string;
  } | undefined;

  const genreScores: Record<string, number> = prefs ? JSON.parse(prefs.genre_scores) : {};
  const usageHours: Record<string, number>  = prefs ? JSON.parse(prefs.usage_hours)  : {};

  const topGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g);

  const peakHour = Object.entries(usageHours).length
    ? Number(Object.entries(usageHours).sort((a, b) => b[1] - a[1])[0][0])
    : new Date().getHours();

  return { genreScores, usageHours, topGenres, peakHour };
}

// ─── Algoritmo Top 10 ─────────────────────────────────────────────────────────

export function computeTop10Score(item: ContentItem): number {
  const now = new Date();
  const yearAge = now.getFullYear() - item.year;

  // Recência: conteúdos mais novos recebem bônus
  const recencyBonus = Math.max(0, 10 - yearAge) * 5;

  // Popularidade normalizada (log para suavizar outliers)
  const popularityScore = Math.log10(Math.max(1, item.popularity)) * 10;

  // Score editorial (0-10) * peso
  const editorialScore = item.score * 8;

  // Destaque editorial
  const featuredBonus = item.featured ? 15 : 0;

  return popularityScore * 0.4 + editorialScore * 0.3 + recencyBonus * 0.2 + featuredBonus * 0.1;
}

// ─── Resolver linhas para um usuário ─────────────────────────────────────────

interface DailyRng {
  seed: number;
  next(): number;
}

function dailyRng(): DailyRng {
  // Semente baseada na data — mesma ordem para todos no mesmo dia
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return {
    seed,
    next() {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    },
  };
}

function shuffleWithRng<T>(arr: T[], rng: DailyRng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function resolveRowContent(
  row: HomeRow,
  allContent: ContentItem[],
  userId?: string,
  history: string[] = [],
): ContentItem[] {
  const pub = allContent.filter(i => i.status === 'published');

  let pool: ContentItem[] = [];

  // ── Filtro por tipo de linha ──────────────────────────────────────────────
  const genres = (row.filterValue ?? '').split(',').map(s => s.trim()).filter(Boolean);

  switch (row.filterType) {
    case 'genre':
      pool = pub.filter(i => genres.some(g => i.genres.includes(g)));
      break;
    case 'genre_movie':
      pool = pub.filter(i => i.type === 'movie' && genres.some(g => i.genres.includes(g)));
      break;
    case 'genre_series':
      pool = pub.filter(i => i.type === 'series' && genres.some(g => i.genres.includes(g)));
      break;
    case 'type':
      pool = pub.filter(i => i.type === row.filterValue);
      break;
    case 'featured':
      pool = pub.filter(i => i.featured);
      break;
    case 'tag':
      pool = pub.filter(i => i.tags.some(t => t.toLowerCase().includes(row.filterValue?.toLowerCase() ?? '')));
      break;
    case 'new':
      pool = [...pub];
      break;
    case 'top10':
      pool = [...pub];
      break;
    default:
      pool = [...pub];
  }

  // ── Boost de personalização ──────────────────────────────────────────────
  if (userId) {
    const prefs = getUserPreferences(userId);
    if (prefs.topGenres.length > 0) {
      // Reordena o pool colocando conteúdos dos gêneros favoritos na frente
      pool = [...pool].sort((a, b) => {
        const scoreA = a.genres.reduce((s, g) => s + (prefs.genreScores[g] ?? 0), 0);
        const scoreB = b.genres.reduce((s, g) => s + (prefs.genreScores[g] ?? 0), 0);
        return scoreB - scoreA;
      });
    }
  }

  // ── Ordenação ─────────────────────────────────────────────────────────────
  switch (row.sortBy) {
    case 'popularity':
      pool = [...pool].sort((a, b) => b.popularity - a.popularity);
      break;
    case 'score':
      pool = [...pool].sort((a, b) => b.score - a.score);
      break;
    case 'year':
      pool = [...pool].sort((a, b) => b.year - a.year);
      break;
    case 'top10_algo':
      pool = [...pool].sort((a, b) => computeTop10Score(b) - computeTop10Score(a));
      break;
    case 'random': {
      const rng = dailyRng();
      pool = shuffleWithRng(pool, rng);
      break;
    }
  }

  // ── Remove itens já assistidos (exceto Top10 e Só Aqui) ───────────────────
  if (history.length > 0 && row.filterType !== 'top10' && row.filterType !== 'featured') {
    const watched = new Set(history);
    const unwatched = pool.filter(i => !watched.has(i.id));
    // Se sobrar poucos, inclui os assistidos no final
    pool = unwatched.length >= 4
      ? unwatched
      : [...unwatched, ...pool.filter(i => watched.has(i.id))];
  }

  return pool.slice(0, row.contentLimit);
}
