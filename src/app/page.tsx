'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ContentRow from '@/components/ContentRow';
import Top10Row from '@/components/Top10Row';
import InfiniteRow from '@/components/InfiniteRow';
import { useUserId } from '@/hooks/useUserId';
import { useContent } from '@/context/ContentContext';
import type { ContentItem } from '@/types/content';
import styles from './page.module.css';

export interface ResolvedRow {
  id: number;
  title: string;
  rowType: 'standard' | 'top10';
  position: number;
  items: ContentItem[];
  // Metadados opcionais para customização futura (ex: 'today', 'genre:action')
  // Isso permite que o Admin envie configurações específicas se necessário
  metadata?: {
    period?: 'day' | 'week' | 'month' | 'all_time';
    genreId?: string;
  };
}

export default function HomePage() {
  const userId           = useUserId();
  const router = useRouter();
  const { items }        = useContent();
  const [rows, setRows]  = useState<ResolvedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;  // aguarda userId do localStorage
    setLoading(true);
    fetch(`/api/home?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(json => { 
        if (json.ok){ 
          setRows(json.data);
        } 
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [userId]);

  const published = items.filter(i => i.status === 'published');

  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection items={published} />
      <main className={styles.main}>
        {
        loading && rows.length === 0 ? (
          <div className={styles.loadingRows}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.rowSkeleton} />
            ))}
          </div>
        ) : (
          rows.map(row => {
            // Renderiza Top 10 (seja geral, hoje, ou por gênero, conforme o título/items vindos da API)
            if (row.rowType === 'top10') {
              //if(row.items.length > 0) {
                return <Top10Row key={row.id} title={row.title} items={row.items} />;
              //} else {
              //  return null;
              //}
            }

            return <ContentRow key={row.id} title={row.title} items={row.items} />;
          })
        )}
      </main>
      <footer className={styles.footer}>
        <span>StreamVault © 2025 · Construído com Next.js + TypeScript</span>
      </footer>
    </div>
  );
}
