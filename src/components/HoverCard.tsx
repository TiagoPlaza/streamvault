'use client';

import React, { useState, useRef, useCallback, useEffect, type ReactNode, type MouseEvent, } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ContentItem } from '@/types/content';
import { formatDuration } from '@/utils/helpers';
import styles from './HoverCard.module.css';

// ─── Utilitário: URL de preview muted ────────────────────────────────────────

export function previewUrl(item: ContentItem): string | null {
  const vs = item.videoSource;
  if (!vs) return null;
  if (vs.provider === 'youtube')
    return `https://www.youtube.com/embed/${vs.videoId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&loop=1&playlist=${vs.videoId}&start=10`;
  if (vs.provider === 'vimeo')
    return `https://player.vimeo.com/video/${vs.videoId}?autoplay=1&muted=1&controls=0&autopause=0&loop=1&transparent=0`;
  return null;
}

// ─── Popover interno (portal) ─────────────────────────────────────────────────

interface PopoverProps {
  item: ContentItem;
  anchorRect: DOMRect;
  onClose: () => void;
  cancelClose: () => void;
}

function Popover({ item, anchorRect, onClose, cancelClose }: PopoverProps) {
  const router = useRouter();
  const pUrl   = previewUrl(item);
  const [imgErr,   setImgErr]   = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted || typeof document === 'undefined') return null;

  // Posicionamento: centralizado sobre o card, expandido 1.65×
  const SCALE  = 1.65;
  const popW   = Math.min(anchorRect.width * SCALE, 480);
  const vw     = window.innerWidth;
  const scrollY = window.scrollY;

  let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
  let top  = anchorRect.top + scrollY - 16;

  if (left < 16)             left = 16;
  if (left + popW > vw - 16) left = vw - popW - 16;

  return createPortal(
    <>
      <Link
        href={`/watch/${item.id}`}
        className={styles.popover}
        style={{ left, top, width: popW }}
        onMouseEnter={cancelClose}
        onMouseLeave={onClose}
      >
        {/* ── Vídeo / imagem ── */}
        <div className={styles.popVideo}>
          {/* {pUrl ? ( */}
            <iframe
              src={pUrl ? pUrl : ''}
              className={styles.popIframe}
              allow="autoplay; encrypted-media"
              title={item.title}
            />
          {/* ) : !imgErr ? ( */}
            <img
              src={item.thumbnail}
              alt={item.title}
              className={styles.popImg}
              onError={() => setImgErr(true)}
            />
          {/* ) : ( */}
            <div className={styles.popFallback}><span>▶</span></div>
          {/* )} */}
          <div className={styles.popVideoGradient} />
          <h3 className={styles.popTitleOnVideo}>{item.title}</h3>
        </div>

        {/* ── Botões ── */}
        <div className={styles.popControls}>
          <button
            className={styles.popPlayBtn}
            onClick={() => router.push(`/watch/${item.id}`)}
          >
            <PlayIcon /><span>Assistir</span>
          </button>
          <Link
            href={`/watch/${item.id}`}
            className={styles.popInfoBtn}
            title="Mais informações"
          >
            <InfoIcon />
          </Link>
        </div>

        {/* ── Metadata ── */}
        <div className={styles.popMeta}>
          <div className={styles.popMetaRow}>
            <span className={styles.popScore}>★ {item.score.toFixed(1)}</span>
            <span className={styles.popYear}>{item.year}</span>
            <span className={styles.popRating}>{item.rating}</span>
            {item.duration && <span className={styles.popDur}>{formatDuration(item.duration)}</span>}
            {item.seasons  && <span className={styles.popDur}>{item.seasons} temp.</span>}
          </div>
          <div className={styles.popGenres}>
            {item.genres.slice(0, 3).map((g, i) => (
              <React.Fragment key={g}>
                {i > 0 && <span className={styles.popDot}>·</span>}
                <span>{g}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Link>
    </>,
    document.body
  );
}

// ─── Trigger props ─────────────────────────────────────────────────────────────

export interface TriggerProps {
  ref: React.RefObject<HTMLElement>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// ─── HoverCard ─────────────────────────────────────────────────────────────────

interface HoverCardProps {
  item: ContentItem;
  children: (props: { triggerProps: TriggerProps; isOpen: boolean }) => ReactNode;
  /** Delay em ms antes de abrir (default 650) */
  openDelay?: number;
  /** Delay em ms antes de fechar (default 100) */
  closeDelay?: number;
}

export default function HoverCard({
  item,
  children,
  openDelay = 350,
  closeDelay = 100,
}: HoverCardProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const openRef    = useRef<NodeJS.Timeout | null>(null);
  const closeRef   = useRef<NodeJS.Timeout | null>(null);

  const open = useCallback(() => {
    if (closeRef.current) { clearTimeout(closeRef.current); closeRef.current = null; }
    openRef.current = setTimeout(() => {
      if (triggerRef.current) setAnchorRect(triggerRef.current.getBoundingClientRect());
    }, openDelay);
  }, [openDelay]);

  const close = useCallback(() => {
    if (openRef.current) { clearTimeout(openRef.current); openRef.current = null; }
    closeRef.current = setTimeout(() => setAnchorRect(null), closeDelay);
  }, [closeDelay]);

  const closeImmediate = useCallback(() => {
    if (openRef.current)  { clearTimeout(openRef.current);  openRef.current  = null; }
    if (closeRef.current) { clearTimeout(closeRef.current); closeRef.current = null; }
    setAnchorRect(null);
  }, []);

  const cancelCloseTimer = useCallback(() => {
    if (openRef.current)  { clearTimeout(openRef.current);  openRef.current  = null; }
    if (closeRef.current) { clearTimeout(closeRef.current); closeRef.current = null; }
  }, []);

  useEffect(() => () => {
    if (openRef.current)  clearTimeout(openRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
  }, []);

  const triggerProps: TriggerProps = {
    ref: triggerRef,
    onMouseEnter: open,
    onMouseLeave: close,
  };

  return (
    <>
      {children({ triggerProps, isOpen: !!anchorRect })}

      {anchorRect && (
        <Popover
          item={item}
          anchorRect={anchorRect}
          onClose={closeImmediate}
          cancelClose={cancelCloseTimer}
        />
      )}
    </>
  );
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);