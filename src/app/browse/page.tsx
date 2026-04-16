'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContentCard from '@/components/ContentCard';
import { useContent } from '@/context/ContentContext';
import styles from './page.module.css';

export default function BrowsePage() {
  const { items } = useContent();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as 'movie' | 'series' | null;

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>(typeParam ?? 'all');
  const [genreFilter, setGenreFilter] = useState('');
  const [sort, setSort] = useState<'score' | 'year' | 'popularity' | 'title'>('popularity');
  const [search, setSearch] = useState('');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    async function loadGenres() {
      try {
        const response = await fetch('/api/genres');
        if (!response.ok) throw new Error('Falha ao carregar gêneros');
        const { data } = await response.json();
        if(data){
          console.log('Gêneros carregados:', data);
          setGenres(Array.isArray(data) ? data.map((genre: any) => genre.name).filter(Boolean) : []);
        }
      } catch (error) {
        console.error('Erro ao buscar gêneros:', error);
        setGenres([]);
      }
    }
    loadGenres();
  }, []);

  const filtered = useMemo(() => {
    let list = items.filter(i => i.status === 'published');
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    if (genreFilter) list = list.filter(i => i.genres.includes(genreFilter));
    if (search) list = list.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => {
      if (sort === 'score') return b.score - a.score;
      if (sort === 'year') return b.year - a.year;
      if (sort === 'popularity') return b.popularity - a.popularity;
      if (sort === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [items, typeFilter, genreFilter, search, sort]);

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <h1 className={styles.title}>Explorar</h1>
        <p className={styles.sub}>{filtered.length} títulos disponíveis</p>
      </div>

      <div className={styles.filters}>
        <input className={styles.search} placeholder="🔍 Buscar por título ou descrição..."
          value={search} onChange={e => setSearch(e.target.value)} />

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tipo</span>
            {(['all', 'movie', 'series'] as const).map(t => (
              <button key={t} className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'Todos' : t === 'movie' ? 'Filmes' : 'Séries'}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Gênero</span>
            <button className={`${styles.chip} ${!genreFilter ? styles.chipActive : ''}`}
              onClick={() => setGenreFilter('')}>Todos</button>
            {genres.map(g => (
              <button key={g} className={`${styles.chip} ${genreFilter === g ? styles.chipActive : ''}`}
                onClick={() => setGenreFilter(g === genreFilter ? '' : g)}>{g}</button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Ordenar</span>
            {([['popularity', 'Popularidade'], ['score', 'Avaliação'], ['year', 'Lançamento'], ['title', 'A-Z']] as const).map(([v, l]) => (
              <button key={v} className={`${styles.chip} ${sort === v ? styles.chipActive : ''}`}
                onClick={() => setSort(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◉</div>
          <p>Nenhum conteúdo encontrado</p>
          <button onClick={() => { setSearch(''); setGenreFilter(''); setTypeFilter('all'); }}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
