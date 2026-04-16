const store = new Map<string, { count: number; expiresAt: number }>();

/**
 * Verifica se o IP excedeu o limite de requisições.
 * @param ip Identificador do cliente (IP)
 * @param limit Número máximo de tentativas
 * @param windowMs Janela de tempo em milissegundos
 * @returns true se permitido, false se bloqueado
 */
export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now > record.expiresAt) {
    store.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

const RATING_COLORS: Record<string, string> = {
  'L': '#00a650',      // Verde
  '10': '#00abeb',     // Azul
  '12': '#f7cb15',     // Amarelo
  '14': '#f26522',     // Laranja
  '16': '#e20613',     // Vermelho
  '18': '#000000',     // Preto
};

export function getRatingColor (rating: string) {
  const r = rating?.toUpperCase().replace(' ', '');
  return { backgroundColor: RATING_COLORS[r] || '#333', borderColor:RATING_COLORS[r] || '#333' };
};