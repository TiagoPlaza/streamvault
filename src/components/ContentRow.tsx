'use client';
import React, { useRef } from 'react';
import { ContentItem } from '@/types/content';
import ContentCard from './ContentCard';
import styles from './ContentRow.module.css';

interface Props { title: string; items: ContentItem[]; }

export default function ContentRow({ title, items }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.wrapper}>
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => scroll('left')}>‹</button>
        <div ref={rowRef} className={styles.row}>
          {items.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => scroll('right')}>›</button>
      </div>
    </div>
  );
}
