import { NextRequest } from 'next/server';
import { listHomeRows, createHomeRow } from '@/lib/home-rows-repository';
import { ok, err, serverError } from '../_helpers';

export async function GET() {
  try {
    return ok(listHomeRows(false)); // admin vê todas incluindo inativas
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title?.trim())      return err('Título é obrigatório');
    if (!body.filterType?.trim()) return err('filterType é obrigatório');
    const row = createHomeRow({
      title:        body.title.trim(),
      filterType:   body.filterType,
      filterValue:  body.filterValue ?? undefined,
      sortBy:       body.sortBy ?? 'popularity',
      contentLimit: body.contentLimit ? Number(body.contentLimit) : 20,
      position:     body.position ? Number(body.position) : undefined,
      active:       body.active !== false,
      rowType:      body.rowType ?? 'standard',
    });
    return ok(row, 201);
  } catch (e) { return serverError(e); }
}
