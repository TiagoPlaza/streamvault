import { NextRequest } from 'next/server';
import { createUser } from '@/lib/user-repository';
import { createSession } from '@/lib/auth';
import { ok, err, serverError } from '@/app/api/_helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || password.length < 6) return err('Dados inválidos');

    const user = await createUser(email, password, name);
    if (!user) return err('E-mail já cadastrado', 409);

    await createSession(user);

    return ok(user, 201);
  } catch (e) {
    return serverError(e);
  }
}