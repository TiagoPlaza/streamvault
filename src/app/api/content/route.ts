/**
 * GET  /api/content          → lista conteúdos (com filtros)
 * POST /api/content          → cria novo conteúdo
 */

import { NextRequest } from 'next/server';
import { listContent, createContent } from '@/lib/content-repository';
import { ok, err, serverError } from '../_helpers';
import { ContentRating, ContentStatus, ContentType, VideoSource } from '@/types/content';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const result = listContent({
      status:  q.get('status')  ?? undefined,
      type:    q.get('type')    ?? undefined,
      search:  q.get('search')  ?? undefined,
      genre:   q.get('genre')   ?? undefined,
      orderBy: (q.get('orderBy') ?? 'created_at') as 'score' | 'year' | 'popularity' | 'title',
      order:   (q.get('order')  ?? 'desc') as 'asc' | 'desc',
      limit:   q.has('limit')  ? Number(q.get('limit'))  : 500,
      offset:  q.has('offset') ? Number(q.get('offset')) : 0,
    });
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação básica
    if (!body.title?.trim())       return err('Título é obrigatório');
    if (!body.description?.trim()) return err('Descrição é obrigatória');
    if (!body.thumbnail?.trim())   return err('Thumbnail é obrigatória');
    if (!body.type)                return err('Tipo é obrigatório (movie | series)');

    const videoSource: VideoSource | undefined = body.videoSource ?? undefined;

    const item = createContent({
      type:            body.type as ContentType,
      title:           body.title.trim(),
      originalTitle:   body.originalTitle?.trim() || undefined,
      description:     body.description.trim(),
      longDescription: body.longDescription?.trim() || undefined,
      year:            Number(body.year) || new Date().getFullYear(),
      duration:        body.duration ? Number(body.duration) : undefined,
      seasons:         body.seasons  ? Number(body.seasons)  : undefined,
      totalEpisodes:   body.totalEpisodes ? Number(body.totalEpisodes) : undefined,
      genres:          Array.isArray(body.genres) ? body.genres : [],
      rating:          (body.rating ?? 'L') as ContentRating,
      score:           Math.min(10, Math.max(0, Number(body.score) || 7.0)),
      popularity:      Number(body.popularity) || 0,
      status:          (body.status ?? 'draft') as ContentStatus,
      featured:        Boolean(body.featured),
      thumbnail:       body.thumbnail.trim(),
      backdrop:        body.backdrop?.trim() || body.thumbnail.trim(),
      videoSource,
      cast:            Array.isArray(body.cast) ? body.cast : [],
      director:        body.director?.trim() || undefined,
      country:         body.country || 'Internacional',
      language:        body.language || 'Português',
      tags:            Array.isArray(body.tags) ? body.tags : [],
    });

    return ok(item, 201);
  } catch (e) {
    return serverError(e);
  }
}
