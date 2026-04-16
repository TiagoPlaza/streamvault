'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentItem } from '@/types/content';
import { formatDuration } from '@/utils/helpers';
import styles from './HeroSection.module.css';
import { getRatingColor } from '@/lib/rate-limit';

interface Props { items: ContentItem[]; }

export default function HeroSection({ items }: Props) {
  const featured = items.filter(i => i.featured && i.status === 'published').slice(0, 5);
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const active = featured[current];

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => { setCurrent(c => (c + 1) % featured.length); setFading(false); }, 400);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!active) return null;

  const changeTo = (idx: number) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 300);
  };

  return (
    <div className={styles.hero}>
      <div className={`${styles.bg} ${fading ? styles.fading : ''}`}
        style={{ backgroundImage: `url(${active.thumbnail})` }} />
      <div className={styles.gradient} />

      <div className={`${styles.content} ${fading ? styles.fading : ''}`}>
        <div className={styles.meta}>
          {active.featured && <span className={styles.badge}>✦ Destaque</span>}
          <span className={styles.type}>{active.type === 'movie' ? 'Filme' : 'Série'}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.year}>{active.year}</span>
          <span className={styles.dot}>·</span>
          <span 
            className={styles.rating}
            style={getRatingColor(active.rating)}
          >{active.rating}</span>
          {active.duration && <><span className={styles.dot}>·</span><span className={styles.dur}>{formatDuration(active.duration)}</span></>}
          {active.seasons && <><span className={styles.dot}>·</span><span className={styles.dur}>{active.seasons} temporada{active.seasons > 1 ? 's' : ''}</span></>}
        </div>

        <h1 className={styles.title}>{active.title}</h1>
        <p className={styles.desc}>{active.description}</p>

        <div className={styles.genres}>
          {active.genres.slice(0, 3).map(g => <span key={g} className={styles.genre}>{g}</span>)}
        </div>

        <div className={styles.actions}>
          {active.videoSource ? (
            <Link href={`/watch/${active.id}`} className={styles.playBtn}>
              <PlayIcon /> Assistir
            </Link>
          ) : (
            <button className={styles.playBtn} disabled style={{ opacity: .5 }}>
              <PlayIcon /> Em breve
            </button>
          )}
          <Link href={`/watch/${active.id}`} className={styles.infoBtn}>
            <InfoIcon /> Mais informações
          </Link>
        </div>
      </div>

      <div className={styles.dots}>
        {featured.map((_, i) => (
          <button key={i} className={`${styles.dot2} ${i === current ? styles.dotActive : ''}`}
            onClick={() => changeTo(i)} />
        ))}
      </div>
    </div>
  );
}

const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z" /></svg>;
const InfoIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>;
