import { NextRequest } from 'next/server';
import { getEpisodesBySeriesId, createEpisode, replaceEpisodes } from '@/lib/episode-repository';
import { getContentById } from '@/lib/content-repository';
import { ok, err, notFound, serverError } from '../../../_helpers';
import type { VideoSource } from '@/types/content';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const content = getContentById(params.id);
    if (!content) return notFound('Série');
    return ok(getEpisodesBySeriesId(params.id));
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const content = getContentById(params.id);
    if (!content) return notFound('Série');
    if (content.type !== 'series') return err('Episódios só podem ser adicionados a séries');

    const body = await req.json();
    if (!body.title?.trim()) return err('Título do episódio é obrigatório');

    const episode = createEpisode({
      seriesId:    params.id,
      season:      Number(body.season)  || 1,
      episode:     Number(body.episode) || 1,
      title:       body.title.trim(),
      description: body.description?.trim() ?? '',
      duration:    body.duration ? Number(body.duration) : undefined,
      thumbnail:   body.thumbnail?.trim() ?? '',
      videoSource: body.videoSource as VideoSource | undefined,
      releaseDate: body.releaseDate ?? '',
    });

    return ok(episode, 201);
  } catch (e) { return serverError(e); }
}

// PUT com array completo — substitui todos os episódios de uma vez (usado no save do form)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const content = getContentById(params.id);
    if (!content) return notFound('Série');

    const body = await req.json();
    if (!Array.isArray(body.episodes)) return err('episodes deve ser um array');

    const episodes = replaceEpisodes(params.id, body.episodes.map((ep: Record<string, unknown>) => ({
      season:      Number(ep.season)  || 1,
      episode:     Number(ep.episode) || 1,
      title:       String(ep.title ?? '').trim(),
      description: String(ep.description ?? '').trim(),
      duration:    ep.duration ? Number(ep.duration) : undefined,
      thumbnail:   String(ep.thumbnail ?? '').trim(),
      videoSource: ep.videoSource as VideoSource | undefined,
      releaseDate: String(ep.releaseDate ?? ''),
    })));

    return ok(episodes);
  } catch (e) { return serverError(e); }
}