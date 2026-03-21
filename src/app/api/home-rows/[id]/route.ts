import { NextRequest } from 'next/server';
import { updateHomeRow, deleteHomeRow, reorderHomeRows } from '@/lib/home-rows-repository';
import { ok, err, notFound, serverError } from '../../_helpers';

interface Params { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id   = Number(params.id);
    const body = await req.json();

    // Reorder mode: { ids: number[] }
    if (Array.isArray(body.ids)) {
      reorderHomeRows(body.ids);
      return ok({ reordered: true });
    }

    const row = updateHomeRow(id, {
      ...(body.title        !== undefined && { title:        body.title }),
      ...(body.filterType   !== undefined && { filterType:   body.filterType }),
      ...(body.filterValue  !== undefined && { filterValue:  body.filterValue }),
      ...(body.sortBy       !== undefined && { sortBy:       body.sortBy }),
      ...(body.contentLimit !== undefined && { contentLimit: Number(body.contentLimit) }),
      ...(body.position     !== undefined && { position:     Number(body.position) }),
      ...(body.active       !== undefined && { active:       Boolean(body.active) }),
      ...(body.rowType      !== undefined && { rowType:      body.rowType }),
      ...(body.metadata     !== undefined && { metadata:     body.metadata }),
    });
  console.log('Row: ', row);
    if (!row) return notFound('Linha');
    return ok(row);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return err('ID inválido');
    if (!deleteHomeRow(id)) return notFound('Linha');
    return ok({ id, deleted: true });
  } catch (e) { return serverError(e); }
}
