/**
 * GET /api/stats  → métricas para o dashboard admin
 */

import { getStats, listContent } from '@/lib/content-repository';
import { ok, serverError } from '../_helpers';

export async function GET() {
  try {
    const stats = getStats();
    const { items: recent } = listContent({ orderBy: 'created_at', order: 'desc', limit: 5 });
    const { items: topContent } = listContent({ orderBy: 'popularity', order: 'desc', limit: 5 });
    return ok({ stats, recent, topContent });
  } catch (e) {
    return serverError(e);
  }
}
