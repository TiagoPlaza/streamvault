/**
 * GET    /api/content/[id]   → busca por ID
 * PUT    /api/content/[id]   → atualiza (campos enviados)
 * DELETE /api/content/[id]   → remove permanentemente
 */

import { NextRequest } from 'next/server';
import {
  getContentById, updateContent, deleteContent,
} from '@/lib/content-repository';
import { ok, err, notFound, serverError } from '../../_helpers';
import { ContentRating, ContentStatus, ContentType } from '@/types/content';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const item = getContentById(params.id);
    if (!item) return notFound('Conteúdo');
    return ok(item);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const existing = getContentById(params.id);
    if (!existing) return notFound('Conteúdo');

    const body = await req.json();

    // Validações apenas dos campos enviados
    if (body.title !== undefined && !body.title?.trim())
      return err('Título não pode ser vazio');
    if (body.description !== undefined && !body.description?.trim())
      return err('Descrição não pode ser vazia');

    const updated = updateContent(params.id, {
      ...(body.type        !== undefined && { type: body.type as ContentType }),
      ...(body.title       !== undefined && { title: body.title.trim() }),
      ...(body.originalTitle !== undefined && { originalTitle: body.originalTitle || undefined }),
      ...(body.description !== undefined && { description: body.description.trim() }),
      ...(body.longDescription !== undefined && { longDescription: body.longDescription || undefined }),
      ...(body.year        !== undefined && { year: Number(body.year) }),
      ...(body.duration    !== undefined && { duration: body.duration ? Number(body.duration) : undefined }),
      ...(body.seasons     !== undefined && { seasons: body.seasons ? Number(body.seasons) : undefined }),
      ...(body.totalEpisodes !== undefined && { totalEpisodes: body.totalEpisodes ? Number(body.totalEpisodes) : undefined }),
      ...(body.genres      !== undefined && { genres: body.genres }),
      ...(body.rating      !== undefined && { rating: body.rating as ContentRating }),
      ...(body.score       !== undefined && { score: Math.min(10, Math.max(0, Number(body.score))) }),
      ...(body.popularity  !== undefined && { popularity: Number(body.popularity) }),
      ...(body.status      !== undefined && { status: body.status as ContentStatus }),
      ...(body.featured    !== undefined && { featured: Boolean(body.featured) }),
      ...(body.thumbnail   !== undefined && { thumbnail: body.thumbnail.trim() }),
      ...(body.backdrop    !== undefined && { backdrop: body.backdrop.trim() }),
      ...(body.videoSource !== undefined && { videoSource: body.videoSource }),
      ...(body.cast        !== undefined && { cast: body.cast }),
      ...(body.director    !== undefined && { director: body.director || undefined }),
      ...(body.country     !== undefined && { country: body.country }),
      ...(body.language    !== undefined && { language: body.language }),
      ...(body.tags        !== undefined && { tags: body.tags }),
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const deleted = deleteContent(params.id);
    if (!deleted) return notFound('Conteúdo');
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
