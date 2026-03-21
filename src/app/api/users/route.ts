import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUsers } from '@/lib/user-repository';
import { ok, err, serverError } from '@/app/api/_helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    // Protege a rota: apenas administradores podem listar usuários
    if (!session || session.role !== 'admin') {
      return err('Forbidden', 403, 'FORBIDDEN');
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = getUsers(page, limit);

    return ok({
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (e) {
    return serverError(e);
  }
}