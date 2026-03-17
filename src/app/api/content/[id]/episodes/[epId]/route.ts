import { NextRequest } from 'next/server';
import { updateEpisode, deleteEpisode, getEpisodeById } from '@/lib/episode-repository';
import { ok, err, notFound, serverError } from '../../../../_helpers';
import type { VideoSource } from '@/types/content';

interface Params { params: { id: string; epId: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    if (!getEpisodeById(params.epId)) return notFound('Episódio');
    const body = await req.json();
    const updated = updateEpisode(params.epId, {
      ...(body.season      !== undefined && { season:      Number(body.season) }),
      ...(body.episode     !== undefined && { episode:     Number(body.episode) }),
      ...(body.title       !== undefined && { title:       body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.duration    !== undefined && { duration:    body.duration ? Number(body.duration) : undefined }),
      ...(body.thumbnail   !== undefined && { thumbnail:   body.thumbnail }),
      ...(body.videoSource !== undefined && { videoSource: body.videoSource as VideoSource }),
      ...(body.releaseDate !== undefined && { releaseDate: body.releaseDate }),
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    if (!deleteEpisode(params.epId)) return notFound('Episódio');
    return ok({ id: params.epId, deleted: true });
  } catch (e) { return serverError(e); }
}