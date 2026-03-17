'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ContentItem } from '@/types/content';
import HoverCard from './HoverCard';
import styles from './Top10Row.module.css';

function Top10Card({ item, rank }: { item: ContentItem; rank: number }) {
  const [imgError, setImgError] = useState(false);
  console.log("Card: ", item)
  return (
    <HoverCard item={item}>
      {({ triggerProps, isOpen }) => (
        <Link 
          ref={triggerProps.ref as React.RefObject<HTMLAnchorElement>}
          href={`/watch/${item.id}`}
          className={`${styles.card} ${isOpen ? styles.cardActive : ''}`}
          onMouseEnter={triggerProps.onMouseEnter}
          onMouseLeave={triggerProps.onMouseLeave}
        >
          {/* Número gigante */}
          <span className={styles.rank}>{rank}</span>

          {/* Poster vertical 2:3 */}
          <div className={styles.poster}>
            {!imgError ? (
              <img
                src={item.backdrop}
                alt={item.title}
                className={styles.img}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.fallback}>
                <span>▶</span>
                <span className={styles.fallbackTitle}>{item.title}</span>
              </div>
            )}

            {/* Overlay com play + info */}
            <div className={styles.overlay}>
              <div className={styles.playCircle}>
                <PlayIcon />
              </div>
              <div className={styles.overlayInfo}>
                <span className={styles.score}>★ {item.score.toFixed(1)}</span>
                <span className={styles.type}>
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </span>
              </div>
            </div>

            <div className={styles.ratingBadge}>{item.rating}</div>
          </div>

          {/* Título abaixo do poster */}
          <div className={styles.info}>
            <h3 className={styles.title}>{item.title}</h3>
            <span className={styles.genre}>{item.genres[0]}</span>
          </div>
        </Link>
      )}
    </HoverCard>
  );
}

export default function Top10Row({ title = 'Top 10 Hoje', items }: { title?: string; items: ContentItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.wrapper}>
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => scroll('left')}>‹</button>
        <div ref={rowRef} className={styles.row}>
          {items.map((item, i) => (
            <Top10Card key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => scroll('right')}>›</button>
      </div>
    </div>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M8 5v14l11-7z" />
  </svg>
);
