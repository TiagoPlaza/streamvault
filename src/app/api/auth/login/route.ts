import { NextRequest } from 'next/server';
import { createSession } from '@/lib/auth';
import { validateUser } from '@/lib/user-repository';
import { ok, err, serverError } from '@/app/api/_helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await validateUser(email, password);
    if (!user) return err('Credenciais inválidas', 401);

    await createSession(user);

    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}