'use client';
import React, { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { formatDuration } from '@/utils/helpers';
import { ContentItem } from '@/types/content';
import styles from './InfiniteRow.module.css';

// Duplica o array para criar efeito infinito
function infiniteItems(items: ContentItem[]): ContentItem[] {
  if (items.length === 0) return [];
  // Triplica para ter margem dos dois lados
  return [...items, ...items, ...items];
}

interface CardProps { item: ContentItem }

function MiniCard({ item }: CardProps) {
  const [err, setErr] = React.useState(false);
  const hasVideo = !!item.videoSource;
  console.log("VIDEO: ", item)
  return (
    <Link href={`/watch/${item.id}`} className={styles.card}>
      <div className={styles.thumb}>
        {!err
          ? <img src={item.thumbnail} alt={item.title} className={styles.img} onError={() => setErr(true)} />
          : <div className={styles.fallback}><span>▶</span></div>
        }
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <div className={styles.play}>
              {hasVideo ? <PlayIcon /> : <LockIcon />}
            </div>
            <div className={styles.overlayMeta}>
              <span className={styles.score}>★ {item.score.toFixed(1)}</span>
              {item.duration && <span className={styles.dur}>{formatDuration(item.duration)}</span>}
              {item.seasons && <span className={styles.dur}>{item.seasons}T</span>}
            </div>
          </div>
        </div>
        <div className={styles.ratingBadge}>{item.rating}</div>
      </div>
      <p className={styles.itemTitle}>{item.title}</p>
      <div className={styles.metaRow}>
        <span className={styles.year}>{item.year}</span>
        <span className={styles.sep}>·</span>
        <span className={styles.genre}>{item.genres[0]}</span>
      </div>
    </Link>
  );
}

interface Props {
  title: string;
  items: ContentItem[];
  speed?: number; // px/s em autoplay, default 40
}

export default function InfiniteRow({ title, items, speed = 40 }: Props) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const posRef      = useRef(0);
  const rafRef      = useRef<number | null>(null);
  const lastTRef    = useRef<number | null>(null);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragStartPos= useRef(0);
  const velocityRef = useRef(0);      // px/s para momentum
  const prevX       = useRef(0);
  const prevT       = useRef(0);

  const tripled = infiniteItems(items);
  const CARD_W  = 180 + 10; // width + gap

  const getTotalW = useCallback(() => {
    return items.length * CARD_W;
  }, [items.length]);

  // Normaliza posição para loop infinito
  const normalize = useCallback((pos: number) => {
    const total = getTotalW();
    if (total === 0) return pos;
    // Mantém no range do segundo bloco (índice 1)
    let p = pos % total;
    if (p > total) p -= total;
    if (p < 0) p += total;
    return p + total; // sempre no segundo bloco
  }, [getTotalW]);

  const applyPos = useCallback((pos: number) => {
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translateX(${-pos}px)`;
  }, []);

  // Auto-scroll suave
  const autoScroll = useCallback((t: number) => {
    if (isDragging.current) { lastTRef.current = t; rafRef.current = requestAnimationFrame(autoScroll); return; }
    if (lastTRef.current !== null) {
      const dt = (t - lastTRef.current) / 1000;
      posRef.current = normalize(posRef.current + speed * dt);
      applyPos(posRef.current);
    }
    lastTRef.current = t;
    rafRef.current = requestAnimationFrame(autoScroll);
  }, [speed, normalize, applyPos]);

  useEffect(() => {
    if (items.length === 0) return;
    // Começa no segundo bloco para ter espaço de scroll nos dois lados
    posRef.current = getTotalW();
    applyPos(posRef.current);
    rafRef.current = requestAnimationFrame(autoScroll);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [items, getTotalW, applyPos, autoScroll]);

  // ── Drag / swipe ────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    dragStartPos.current= posRef.current;
    prevX.current       = e.clientX;
    prevT.current       = e.timeStamp;
    velocityRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx   = e.clientX - dragStartX.current;
    const dt   = e.timeStamp - prevT.current;
    velocityRef.current = dt > 0 ? (prevX.current - e.clientX) / (dt / 1000) : 0;
    prevX.current = e.clientX;
    prevT.current = e.timeStamp;
    posRef.current = normalize(dragStartPos.current - dx);
    applyPos(posRef.current);
  };

  const onPointerUp = () => {
    isDragging.current = false;
    // Momentum: adiciona velocidade do drag ao scroll automático
    // (o autoScroll loop retoma e vai desacelerando naturalmente)
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    posRef.current = normalize(posRef.current + e.deltaX + e.deltaY * 0.5);
    applyPos(posRef.current);
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div className={styles.track} ref={trackRef}>
          {tripled.map((item, i) => (
            <MiniCard key={`${item.id}_${i}`} item={item} />
          ))}
        </div>
        {/* Fades nas bordas */}
        <div className={styles.fadeLeft}  />
        <div className={styles.fadeRight} />
      </div>
    </div>
  );
}

const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>;
