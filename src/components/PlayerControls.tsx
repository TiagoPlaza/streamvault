'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlayerState } from '@/hooks/useYouTubePlayer';
import { formatTime, clamp } from '@/utils/helpers';
import styles from './PlayerControls.module.css';

interface Props {
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: number;
  isFullscreen: boolean;
  openingStart?: number;
  openingEnd?: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onTogglePlay: () => void;
  onSeek: (s: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (r: number) => void;
  onToggleFullscreen: () => void;
}

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlayerControls({ 
  state, 
  currentTime, 
  duration, 
  volume, 
  muted, 
  playbackRate, 
  buffered, 
  isFullscreen, 
  openingStart = 0, 
  openingEnd = 0,
  containerRef, 
  onTogglePlay, 
  onSeek, 
  onVolumeChange, 
  onToggleMute, 
  onPlaybackRateChange, 
  onToggleFullscreen 
}: Props) {
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVol, setIsDraggingVol] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const [visible, setVisible] = useState(true);
  const hideRef = useRef<NodeJS.Timeout | null>(null);

  const resetHide = useCallback(() => {
    setVisible(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => { if (state === 'playing') setVisible(false); }, 3000);
  }, [state]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('mousemove', resetHide);
    c.addEventListener('mouseleave', () => { if (state === 'playing') setVisible(false); });
    return () => { c.removeEventListener('mousemove', resetHide); };
  }, [containerRef, resetHide, state]);

  useEffect(() => { if (state !== 'playing') setVisible(true); }, [state]);

  const getPct = useCallback((e: React.MouseEvent | MouseEvent) => {
    const r = progressRef.current?.getBoundingClientRect();
    return r ? clamp((e.clientX - r.left) / r.width, 0, 1) : 0;
  }, []);
  const getVolPct = useCallback((e: React.MouseEvent | MouseEvent) => {
    const r = volumeRef.current?.getBoundingClientRect();
    return r ? clamp((e.clientX - r.left) / r.width, 0, 1) : 0;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const mv = (e: MouseEvent) => onSeek(getPct(e) * duration);
    const up = () => setIsDragging(false);
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, [isDragging, getPct, duration, onSeek]);

  useEffect(() => {
    if (!isDraggingVol) return;
    const mv = (e: MouseEvent) => onVolumeChange(Math.round(getVolPct(e) * 100));
    const up = () => setIsDraggingVol(false);
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, [isDraggingVol, getVolPct, onVolumeChange]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const isPlaying = state === 'playing';

  // Verifica se está dentro do tempo de abertura
  const isInOpening = openingStart < openingEnd && currentTime >= openingStart && currentTime < openingEnd;
  // Verifica se há abertura configurada
  const hasOpening = openingStart < openingEnd && openingEnd > 0;

  const handleSkipOpening = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeek(openingEnd);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen(); else document.exitFullscreen();
    onToggleFullscreen();
  };

  return (
    <div className={styles.controls}>
      {hasOpening && isInOpening && (
        <button 
          className={styles.skipOpeningFloating} 
          title={`Pular abertura (até ${formatTime(openingEnd)})`}
          onClick={handleSkipOpening}>
          Pular abertura
        </button>
      )}
      <div className={`${styles.contentControls} ${visible ? styles.visible : styles.hidden}`}>
        <div className={styles.progressWrapper}>
          {hoverTime && <div className={styles.tooltip} style={{ left: hoverTime.x }}>{formatTime(hoverTime.time)}</div>}
          <div ref={progressRef} className={styles.progressBar}
            onClick={e => { e.stopPropagation(); onSeek(getPct(e) * duration); }}
            onMouseDown={e => { e.preventDefault(); setIsDragging(true); onSeek(getPct(e) * duration); }}
            onMouseMove={e => { const r = progressRef.current?.getBoundingClientRect(); if (r) setHoverTime({ time: clamp((e.clientX - r.left) / r.width, 0, 1) * duration, x: e.clientX - r.left }); }}
            onMouseLeave={() => setHoverTime(null)}>
            <div className={styles.track}>
              <div className={styles.buffered} style={{ width: `${buffPct}%` }} />
              <div className={styles.fill} style={{ width: `${progress}%` }} />
              <div className={styles.thumb} style={{ left: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.left}>
            <button className={styles.btn} onClick={e => { e.stopPropagation(); onTogglePlay(); }}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button className={styles.btn} onClick={e => { e.stopPropagation(); onSeek(Math.max(0, currentTime - 10)); }}><Rewind /></button>
            <button className={styles.btn} onClick={e => { e.stopPropagation(); onSeek(Math.min(duration, currentTime + 10)); }}><Forward /></button>
            {/* Botão Skip Intro - aparece apenas quando está dentro da abertura */}
            <div className={styles.volGroup}>
              <button className={styles.btn} onClick={e => { e.stopPropagation(); onToggleMute(); }}>
                {muted || volume === 0 ? <VolMute /> : volume < 50 ? <VolLow /> : <VolHigh />}
              </button>
              <div ref={volumeRef} className={styles.volBar}
                onClick={e => { e.stopPropagation(); onVolumeChange(Math.round(getVolPct(e) * 100)); }}
                onMouseDown={e => { e.preventDefault(); setIsDraggingVol(true); onVolumeChange(Math.round(getVolPct(e) * 100)); }}>
                <div className={styles.volTrack}>
                  <div className={styles.volFill} style={{ width: `${muted ? 0 : volume}%` }} />
                  <div className={styles.volThumb} style={{ left: `${muted ? 0 : volume}%` }} />
                </div>
              </div>
            </div>
            <div className={styles.time}>
              <span className={styles.curr}>{formatTime(currentTime)}</span>
              <span className={styles.sep}>/</span>
              <span className={styles.total}>{formatTime(duration)}</span>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.rateWrap}>
              <button className={`${styles.btn} ${styles.rateBtn}`} onClick={e => { e.stopPropagation(); setShowRates(!showRates); }}>{playbackRate}×</button>
              {showRates && (
                <div className={styles.rateMenu}>
                  {RATES.map(r => (
                    <button key={r} className={`${styles.rateOpt} ${r === playbackRate ? styles.rateActive : ''}`}
                      onClick={e => { e.stopPropagation(); onPlaybackRateChange(r); setShowRates(false); }}>{r}×</button>
                  ))}
                </div>
              )}
            </div>
            <button className={styles.btn} onClick={handleFullscreen}>
              {isFullscreen ? <ExitFs /> : <Fullscreen />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Play = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M8 5v14l11-7z" /></svg>;
const Pause = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const Rewind = () => <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /><text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">10</text></svg>;
const Forward = () => <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /><text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">10</text></svg>;
const VolHigh = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>;
const VolLow = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>;
const VolMute = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>;
const Fullscreen = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>;
const ExitFs = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>;
const SkipIntro = () => <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>;