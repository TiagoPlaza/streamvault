/**
 * PATCH /api/content/[id]/featured  → alterna o destaque do conteúdo
 */

import { NextRequest } from 'next/server';
import { toggleFeatured } from '@/lib/content-repository';
import { ok, notFound, serverError } from '../../../_helpers';

interface Params { params: { id: string } }

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const item = toggleFeatured(params.id);
    if (!item) return notFound('Conteúdo');
    return ok(item);
  } catch (e) {
    return serverError(e);
  }
}
