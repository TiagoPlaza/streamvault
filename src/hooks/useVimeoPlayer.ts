'use client';
import { useRef, useState, useEffect, useCallback, RefObject } from 'react';
import { PlayerState } from './useYouTubePlayer';

interface VimeoPlayer {
  ready(): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  getCurrentTime(): Promise<number>;
  setCurrentTime(s: number): Promise<number>;
  getDuration(): Promise<number>;
  getVolume(): Promise<number>;
  setVolume(v: number): Promise<number>;
  getMuted(): Promise<boolean>;
  setMuted(m: boolean): Promise<boolean>;
  getPlaybackRate(): Promise<number>;
  setPlaybackRate(r: number): Promise<number>;
  getBuffered(): Promise<{ start: number; end: number }[]>;
  on(event: string, cb: (d: Record<string, unknown>) => void): void;
  destroy(): Promise<void>;
}

declare global {
  interface Window {
    Vimeo: {
      Player: new (
        el: HTMLElement,
        opts?: Record<string, unknown>
      ) => VimeoPlayer;
    };
  }
}

let vimeoLoading = false, vimeoLoaded = false;
const vimeoCbs: (() => void)[] = [];

function loadVimeoAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (vimeoLoaded) { resolve(); return; }
    vimeoCbs.push(resolve);
    if (vimeoLoading) return;
    vimeoLoading = true;
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.onload = () => {
      vimeoLoaded = true;
      vimeoCbs.forEach(cb => cb());
      vimeoCbs.length = 0;
    };
    document.head.appendChild(script);
  });
}

export interface VimeoPlayerHookReturn {
  // mountRef aponta para um <div> — o SDK cria o <iframe> dentro dele
  mountRef: RefObject<HTMLDivElement>;
  ready: boolean; state: PlayerState;
  currentTime: number; duration: number; volume: number;
  muted: boolean; playbackRate: number; buffered: number; isFullscreen: boolean;
  play: () => void; pause: () => void; togglePlay: () => void;
  seek: (s: number) => void; setVolume: (v: number) => void;
  toggleMute: () => void; setPlaybackRate: (r: number) => void;
}

export function useVimeoPlayer(videoId: string): VimeoPlayerHookReturn {
  // mountRef é um <div> — o Vimeo SDK injeta o <iframe> dentro dele
  const mountRef     = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<VimeoPlayer | null>(null);
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const fallbackRef  = useRef<NodeJS.Timeout | null>(null);
  const isReadyRef   = useRef(false);
  const prevVolRef   = useRef(0.7);
  const isPlayingRef = useRef(false);

  const [ready,        setReady]             = useState(false);
  const [state,        setState]             = useState<PlayerState>('idle');
  const [currentTime,  setCurrentTime]       = useState(0);
  const [duration,     setDuration]          = useState(0);
  const [volume,       setVolumeState]       = useState(70);
  const [muted,        setMuted]             = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [buffered,     setBuffered]          = useState(0);
  const [isFullscreen, setIsFullscreen]      = useState(false);

  const startPolling = useCallback((p: VimeoPlayer) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const [t, d, v, m, b] = await Promise.all([
          p.getCurrentTime(), p.getDuration(),
          p.getVolume(), p.getMuted(), p.getBuffered(),
        ]);
        setCurrentTime(t);
        setDuration(d);
        setVolumeState(Math.round(v * 100));
        setMuted(m);
        setBuffered(b[b.length - 1]?.end ?? 0);
      } catch {}
    }, 250);
  }, []);

  useEffect(() => {
    let destroyed = false;

    isReadyRef.current   = false;
    isPlayingRef.current = false;
    setReady(false);
    setState('idle');
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);

    const markReady = (p: VimeoPlayer) => {
      if (isReadyRef.current || destroyed) return;
      isReadyRef.current = true;
      if (fallbackRef.current) { clearTimeout(fallbackRef.current); fallbackRef.current = null; }
      p.getDuration()
        .then(d => { if (!destroyed) { setDuration(d); setReady(true); setState('idle'); startPolling(p); } })
        .catch(() => { if (!destroyed) { setReady(true); setState('idle'); startPolling(p); } });
    };

    loadVimeoAPI().then(() => {
      if (destroyed || !mountRef.current) return;

      // Limpa o div antes de criar novo player (evita iframe duplicado)
      mountRef.current.innerHTML = '';

      // O SDK cria e gerencia o <iframe> dentro do mountRef div.
      // Passando { id } + { controls: false } em vez de uma URL manual,
      // o SDK controla o ciclo de vida do iframe — resolve o problema de
      // iframe com src já definido que não dispara 'ready' ao remontar.
      const p = new window.Vimeo.Player(mountRef.current, {
        id:         videoId,
        controls:   false,
        autoplay:   false,
        muted:      false,
        transparent: false,
        dnt:        true,
        width:      '100%',
      });

      playerRef.current = p;

      // p.ready() é a forma mais confiável — resolve quando o SDK está pronto
      p.ready()
        .then(() => {
          // O SDK cria o <iframe> mas não adiciona allowFullScreen.
          // Adicionamos manualmente após o player estar pronto.
          const iframe = mountRef.current?.querySelector('iframe');
          if (iframe) {
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
            iframe.className = 'vimeoIframe';
          }
          markReady(p);
        })
        .catch(() => { /* coberto pelo fallback */ });

      // Backup: evento 'loaded'
      p.on('loaded', () => markReady(p));

      // Fallback de 8s
      fallbackRef.current = setTimeout(() => {
        if (!isReadyRef.current && !destroyed) {
          isReadyRef.current = true;
          setReady(true);
          setState('idle');
          startPolling(p);
        }
      }, 8000);

      p.on('play',        () => { if (!destroyed) { isPlayingRef.current = true;  setState('playing'); } });
      p.on('pause',       () => { if (!destroyed) { isPlayingRef.current = false; setState('paused');  } });
      p.on('ended',       () => { if (!destroyed) { isPlayingRef.current = false; setState('ended');   } });
      p.on('bufferstart', () => { if (!destroyed) setState('loading'); });
      p.on('bufferend',   () => { if (!destroyed) setState('playing'); });
      p.on('error',       () => { if (!destroyed) { isPlayingRef.current = false; setState('error');   } });
      p.on('playbackratechange', (d) => {
        if (!destroyed) setPlaybackRateState(d.playbackRate as number);
      });
    });

    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);

    return () => {
      destroyed = true;
      isPlayingRef.current = false;
      isReadyRef.current   = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      document.removeEventListener('fullscreenchange', handleFs);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, startPolling]);

  const play  = useCallback(() => { try { playerRef.current?.play();  } catch {} }, []);
  const pause = useCallback(() => { try { playerRef.current?.pause(); } catch {} }, []);

  const togglePlay = useCallback(() => {
    try {
      if (isPlayingRef.current) playerRef.current?.pause();
      else                      playerRef.current?.play();
    } catch {}
  }, []);

  const seek = useCallback((s: number) => {
    try { playerRef.current?.setCurrentTime(s); } catch {}
  }, []);

  const setVolume = useCallback((v: number) => {
    try {
      playerRef.current?.setVolume(v / 100);
      if (v > 0) { playerRef.current?.setMuted(false); setMuted(false); }
      setVolumeState(v);
    } catch {}
  }, []);

  const toggleMute = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const m = await p.getMuted();
      if (m) { await p.setMuted(false); await p.setVolume(prevVolRef.current); setMuted(false); }
      else   { prevVolRef.current = await p.getVolume(); await p.setMuted(true); setMuted(true); }
    } catch {}
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    try { playerRef.current?.setPlaybackRate(r); } catch {}
  }, []);

  return {
    mountRef, ready, state, currentTime, duration,
    volume, muted, playbackRate, buffered, isFullscreen,
    play, pause, togglePlay, seek, setVolume, toggleMute, setPlaybackRate,
  };
}
