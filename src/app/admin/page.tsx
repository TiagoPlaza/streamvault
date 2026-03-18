import { getViewingStats } from '@/services/viewing-history.service';
import { listContent } from '@/lib/content-repository';
import DashboardView from '@/features/admin/dashboard/components/dashboard-view';

export default async function AdminDashboard() {
  // Os dados de conteúdo e estatísticas agora são buscados no lado do servidor,
  // eliminando a necessidade de um fetch no cliente.
  const { items } = listContent();
  const viewStats = getViewingStats();

  // Mapeia os itens injetando a contagem real de views
  const itemsWithRealViews = items.map(item => ({
    ...item,
    // Prioriza o dado da tabela de histórico, senão usa a popularity base
    displayViews: viewStats[item.id] || item.popularity || 0
  }));

  const stats = {
    total: items.length,
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
    movies: items.filter(i => i.type === 'movie').length,
    series: items.filter(i => i.type === 'series').length,
    // Soma as views REAIS de todos os itens
    totalViews: Object.values(viewStats).reduce((a, b) => a + b, 0),
    featured: items.filter(i => i.featured).length,
    avgScore: items.length > 0 ? items.reduce((s, i) => s + i.score, 0) / items.length : 0,
  };

  const recent = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const topContent = [...itemsWithRealViews].sort((a, b) => b.displayViews - a.displayViews).slice(0, 5);

  return <DashboardView stats={stats} recent={recent} topContent={topContent} />;
}
