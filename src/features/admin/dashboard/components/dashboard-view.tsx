import React from 'react';
import Link from 'next/link';
import { formatViews, formatDate } from '@/utils/helpers';
import styles from '@/app/admin/page.module.css';
import { ContentItem } from '@/types/content';

interface DashboardViewProps {
  stats: {
    total: number;
    published: number;
    draft: number;
    movies: number;
    series: number;
    totalViews: number;
    featured: number;
    avgScore: number;
  };
  recent: ContentItem[];
  topContent: (ContentItem & { displayViews: number })[];
}

export default function DashboardView({ stats, recent, topContent }: DashboardViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Visão geral da plataforma</p>
        </div>
        <Link href="/admin/content/new" className={styles.addBtn}>+ Adicionar conteúdo</Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Total de títulos" value={stats.total} icon="🎬" color="blue" />
        <StatCard label="Publicados" value={stats.published} icon="✓" color="green" />
        <StatCard label="Rascunhos" value={stats.draft} icon="◌" color="amber" />
        <StatCard label="Total de views" value={formatViews(stats.totalViews)} icon="👁" color="purple" />
        <StatCard label="Filmes" value={stats.movies} icon="🎥" color="blue" />
        <StatCard label="Séries" value={stats.series} icon="📺" color="blue" />
        <StatCard label="Em destaque" value={stats.featured} icon="✦" color="amber" />
        <StatCard label="Nota média" value={stats.avgScore.toFixed(1)} icon="★" color="amber" />
      </div>

      <div className={styles.tables}>
        {/* Recent */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Adicionados recentemente</h3>
            <Link href="/admin/content" className={styles.tableLink}>Ver todos</Link>
          </div>
          <table className={styles.table}>
            <thead><tr><th>Título</th><th>Tipo</th><th>Status</th><th>Atualizado</th></tr></thead>
            <tbody>
              {recent.map(item => (
                <tr key={item.id}>
                  <td><Link href={`/admin/content/${item.id}`} className={styles.itemLink}>{item.title}</Link></td>
                  <td><span className={styles.typeTag}>{item.type === 'movie' ? 'Filme' : 'Série'}</span></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className={styles.dateCell}>{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Mais populares</h3>
          </div>
          <table className={styles.table}>
            <thead><tr><th>Título</th><th>Nota</th><th>Views</th></tr></thead>
            <tbody>
              {topContent.map((item, i) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.rankRow}>
                      <span className={styles.rank}>#{i + 1}</span>
                      <Link href={`/admin/content/${item.id}`} className={styles.itemLink}>{item.title}</Link>
                    </div>
                  </td>
                  <td><span className={styles.scoreCell}>★ {item.score.toFixed(1)}</span></td>
                  <td className={styles.viewsCell}>{formatViews(item.displayViews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return <div className={`${styles.statCard} ${styles[`color_${color}`]}`}><div className={styles.statIcon}>{icon}</div><div className={styles.statValue}>{value}</div><div className={styles.statLabel}>{label}</div></div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { published: styles.statusPublished, draft: styles.statusDraft, archived: styles.statusArchived };
  const lbl: Record<string, string> = { published: 'Publicado', draft: 'Rascunho', archived: 'Arquivado' };
  return <span className={`${styles.statusBadge} ${map[status]}`}>{lbl[status]}</span>;
}