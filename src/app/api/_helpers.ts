import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function notFound(resource = 'Recurso') {
  return err(`${resource} não encontrado`, 404);
}

export function serverError(e: unknown) {
  const message = e instanceof Error ? e.message : 'Erro interno';
  console.error('[API Error]', e);
  return err(message, 500);
}
