import { getSession } from '@/lib/auth';
import { getUsers } from '@/lib/user-repository';
import { ok, err, serverError } from '@/app/api/_helpers';

export async function GET() {
  try {
    const session = await getSession();

    // Protege a rota: apenas administradores podem listar usuários
    if (!session || session.role !== 'admin') {
      return err('Não autorizado', 403);
    }

    const users = getUsers();
    return ok(users);
  } catch (e) {
    return serverError(e);
  }
}