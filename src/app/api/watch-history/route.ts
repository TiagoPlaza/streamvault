import { NextRequest } from 'next/server';
import { recordWatch, getUserPreferences } from '@/lib/personalization';
import { ok, err, serverError } from '../_helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.userId)    return err('userId é obrigatório');
    if (!body.contentId) return err('contentId é obrigatório');

    recordWatch(body.userId, {
      contentId:      body.contentId,
      episodeId:      body.episodeId ?? undefined,
      secondsWatched: Number(body.secondsWatched) || 0,
      completed:      Boolean(body.completed),
    });

    return ok({ recorded: true });
  } catch (e) { return serverError(e); }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return err('userId é obrigatório');
    const prefs = getUserPreferences(userId);
    return ok(prefs);
  } catch (e) { return serverError(e); }
}
