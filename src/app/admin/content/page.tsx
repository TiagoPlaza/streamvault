import { getViewingStats } from '@/services/viewing-history.service';
import ContentList from '@/features/admin/content/components/content-list';

export default async function ContentListPage() {
  // Busca dados diretamente do banco no servidor
  const viewStats = getViewingStats();

  return <ContentList viewStats={viewStats} />;
}
