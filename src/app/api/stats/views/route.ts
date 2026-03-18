import { NextRequest } from 'next/server';
import { ok, serverError } from '@/app/api/_helpers';
import { getViewingStats } from '@/services/viewing-history.service';

export async function GET(req: NextRequest) {
  try {
    const statsMap = getViewingStats();
    return ok(statsMap);
  } catch (e) {
    console.error('[API Stats Error]', e);
    return serverError(e);
  }
}