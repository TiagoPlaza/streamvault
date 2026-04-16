'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ContentItem } from '@/types/content';
import { formatDuration } from '@/utils/helpers';
import HoverCard from './HoverCard';
import styles from './ContentCard.module.css';

interface Props { item: ContentItem; size?: 'sm' | 'md' | 'lg'; }

export default function ContentCard({ item, size = 'md' }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <HoverCard item={item}>
      {({ triggerProps, isOpen }) => (
        <Link
          ref={triggerProps.ref as React.RefObject<HTMLAnchorElement>}
          href={`/watch/${item.id}`}
          className={`${styles.card}${styles[size] ? ` ${styles[size]}` : ''}${isOpen ? ` ${styles.cardActive}` : ''}`}
          onMouseEnter={triggerProps.onMouseEnter}
          onMouseLeave={triggerProps.onMouseLeave}
        >
          <div className={styles.thumb}>
            {!imgError ? (
              <img
                src={item.thumbnail} alt={item.title}
                className={styles.img} onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.fallback}>
                <span className={styles.fallbackIcon}>▶</span>
              </div>
            )}
            {item.featured && <div className={styles.featuredBadge}>✦</div>}
            {item.status === 'draft' && <div className={styles.draftBadge}>RASCUNHO</div>}
          </div>
          <div className={styles.info}>
            <h3 className={styles.title}>{item.title}</h3>
            <div className={styles.metaRow}>
              <span className={styles.year}>{item.year}</span>
              <span className={styles.sep}>·</span>
              <span className={styles.genre}>{item.genres[0]}</span>
            </div>
          </div>
        </Link>
      )}
    </HoverCard>
  );
}
