'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useContent } from '@/context/ContentContext';
import { formatDate, formatViews } from '@/utils/helpers';
import styles from './page.module.css';

export default function ContentListPage() {
  const { items, deleteItem, toggleFeatured, toggleStatus } = useContent();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    if (search) list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, statusFilter, typeFilter, search]);

  const handleDelete = (id: string) => {
    if (confirmDelete === id) { deleteItem(id); setConfirmDelete(null); }
    else setConfirmDelete(id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gerenciar Conteúdo</h1>
          <p className={styles.sub}>{filtered.length} de {items.length} títulos</p>
        </div>
        <Link href="/admin/content/new" className={styles.addBtn}>+ Novo conteúdo</Link>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Buscar por título..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filters}>
          <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
          <select className={styles.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">Todos os tipos</option>
            <option value="movie">Filmes</option>
            <option value="series">Séries</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Conteúdo</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Nota</th>
              <th>Views</th>
              <th>Destaque</th>
              <th>Atualizado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className={styles.row}>
                <td>
                  <div className={styles.contentCell}>
                    <div className={styles.thumb}>
                      <img src={item.thumbnail} alt={item.title}
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <div>
                      <div className={styles.contentTitle}>{item.title}</div>
                      <div className={styles.contentYear}>{item.year} · {item.genres[0]}</div>
                    </div>
                  </div>
                </td>
                <td><span className={styles.typeTag}>{item.type === 'movie' ? '🎥 Filme' : '📺 Série'}</span></td>
                <td>
                  <button className={`${styles.statusBtn} ${styles[`st_${item.status}`]}`}
                    onClick={() => toggleStatus(item.id)}>
                    {item.status === 'published' ? 'Publicado' : item.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                  </button>
                </td>
                <td><span className={styles.score}>★ {item.score.toFixed(1)}</span></td>
                <td><span className={styles.views}>{formatViews(item.popularity)}</span></td>
                <td>
                  <button className={`${styles.featBtn} ${item.featured ? styles.featActive : ''}`}
                    onClick={() => toggleFeatured(item.id)} title="Toggle destaque">
                    {item.featured ? '✦' : '○'}
                  </button>
                </td>
                <td className={styles.date}>{formatDate(item.updatedAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/watch/${item.id}`} className={styles.actionBtn} title="Ver">👁</Link>
                    <Link href={`/admin/content/${item.id}`} className={styles.actionBtn} title="Editar">✎</Link>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn} ${confirmDelete === item.id ? styles.deleteConfirm : ''}`}
                      onClick={() => handleDelete(item.id)}
                      title={confirmDelete === item.id ? 'Clique novamente para confirmar' : 'Excluir'}>
                      {confirmDelete === item.id ? '!' : '✕'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>Nenhum conteúdo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
