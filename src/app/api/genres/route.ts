import { NextRequest } from 'next/server';
import { listGenres, createGenre } from '@/lib/genre-repository';
import { ok, err, serverError } from '../_helpers';

export async function GET() {
  try {
    return ok(listGenres());
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return err('Nome do gênero é obrigatório');
    const genre = createGenre(name);
    return ok(genre, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    if (msg.includes('já existe')) return err(msg, 409);
    return serverError(e);
  }
}