import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protege rotas que começam com /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('auth_token')?.value;

    // 1. Sem token -> Redireciona para Login
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // 2. Com token -> Verifica validade e Role
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      // Usuário logado mas sem permissão
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};