/**
 * PATCH /api/content/[id]/status  → alterna published ↔ draft
 */

import { NextRequest } from 'next/server';
import { toggleStatus } from '@/lib/content-repository';
import { ok, notFound, serverError } from '../../../_helpers';

interface Params { params: { id: string } }

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const item = toggleStatus(params.id);
    if (!item) return notFound('Conteúdo');
    return ok(item);
  } catch (e) {
    return serverError(e);
  }
}
