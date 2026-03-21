import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { upsertWatchHistory, getWatchHistory } from '@/lib/user-repository';
import { recordWatch } from '@/lib/personalization';
import { ok, err, serverError } from '@/app/api/_helpers';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err('Unauthorized', 401);

    const body = await req.json();
    // Prioriza episodeId se fornecido (séries), caso contrário usa contentId
    const targetId = body.episodeId || body.contentId;
    // Aceita tanto 'seconds' quanto 'secondsWatched' para compatibilidade
    const secs = body.seconds ?? body.secondsWatched;

    if (!targetId || typeof secs !== 'number') return err('Invalid data', 400);

    upsertWatchHistory(session.id, targetId, secs);
    recordWatch(body.userId, {
      contentId:      body.contentId,
      episodeId:      body.episodeId ?? undefined,
      secondsWatched: Number(body.secondsWatched) || 0,
      completed:      Boolean(body.completed), 
    });

    return ok({ saved: true });
  } catch (e) {
    return serverError(e);
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return err('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get('contentId');
  if (!contentId) return err('Missing contentId', 400);

  const history = getWatchHistory(session.id, contentId);
  return ok({ seconds: history?.seconds_watched || 0 });
}