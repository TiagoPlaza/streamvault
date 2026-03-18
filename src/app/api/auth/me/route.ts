import { getSession } from '@/lib/auth';
import { ok, err } from '@/app/api/_helpers';

export async function GET() {
  // Recupera os dados do usuário decodificando o token do cookie
  const user = await getSession();
  
  if (!user) return err('Não autenticado', 401);
  
  return ok(user);
}