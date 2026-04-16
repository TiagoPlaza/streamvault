/**
 * GET /api/home?userId=xxx
 *
 * Retorna as linhas da home já com os conteúdos resolvidos,
 * personalizados para o userId fornecido.
 */

import { NextRequest } from 'next/server';
import { listHomeRows } from '@/lib/home-rows-repository';
import { resolveRowContent, getUserHistory } from '@/lib/personalization';
import { listContent } from '@/lib/content-repository';
import { ok, serverError } from '../_helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') ?? undefined;
    const rows   = listHomeRows(true);
    const { items: allContent } = listContent({ status: 'published', limit: 500 });

    const history = userId ? getUserHistory(userId) : [];

    const resolved = rows.map(row => ({
      id:       row.id,
      title:    row.title,
      rowType:  row.rowType,
      position: row.position,
      items:    resolveRowContent(row, allContent, userId, history),
      metadata: row.metadata,
    })).filter(r => r.items.length > 0);

    return ok(resolved);
  } catch (e) {
    return serverError(e);
  }
}
