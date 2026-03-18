import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUserRole, deleteUser } from '@/lib/user-repository';
import { ok, err, serverError, notFound } from '@/app/api/_helpers';
import type { UserRole } from '@/lib/auth';

// Handler para atualizar o cargo de um usuário
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return err('Não autorizado', 403);
    }

    // Um admin não pode alterar o próprio cargo
    if (session.id === params.id) {
      return err('Não é permitido alterar o próprio cargo.', 400);
    }

    const { role } = await req.json();
    if (role !== 'admin' && role !== 'user') {
      return err('Cargo inválido', 400);
    }

    const success = updateUserRole(params.id, role as UserRole);
    if (!success) return notFound('Usuário');

    return ok({ message: 'Cargo atualizado com sucesso' });
  } catch (e) {
    return serverError(e);
  }
}

// Handler para deletar um usuário
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return err('Não autorizado', 403);
    }

    // Um admin não pode deletar a si mesmo
    if (session.id === params.id) {
      return err('Não é permitido deletar a si mesmo.', 400);
    }

    const success = deleteUser(params.id);
    if (!success) return notFound('Usuário');

    return ok({ message: 'Usuário deletado com sucesso' });
  } catch (e) {
    return serverError(e);
  }
}