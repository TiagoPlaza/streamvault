import { NextRequest } from 'next/server';
import { updateGenre, deleteGenre } from '@/lib/genre-repository';
import { ok, err, notFound, serverError } from '../../_helpers';

interface Params { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return err('ID inválido');
    const { name } = await req.json();
    if (!name?.trim()) return err('Nome é obrigatório');
    const genre = updateGenre(id, name);
    return ok(genre);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('não encontrado')) return notFound('Gênero');
    if (msg.includes('já existe')) return err(msg, 409);
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return err('ID inválido');
    const deleted = deleteGenre(id);
    if (!deleted) return notFound('Gênero');
    return ok({ id, deleted: true });
  } catch (e) {
    return serverError(e);
  }
}