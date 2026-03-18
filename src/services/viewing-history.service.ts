import getDb from '@/lib/db';

/**
 * Retorna um mapa com o total de visualizações por conteúdo.
 * Chave: contentId, Valor: total de views.
 */
export function getViewingStats(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT content_id AS contentId, COUNT(*) as count 
    FROM viewing_history 
    GROUP BY content_id
  `).all() as { contentId: string; count: number }[];

  return rows.reduce((acc, row) => {
    acc[row.contentId] = row.count;
    return acc;
  }, {} as Record<string, number>);
}