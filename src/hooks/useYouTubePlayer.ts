'use client';
import { useRef, useState, useEffect, useCallback, RefObject } from 'react';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoading = false, apiLoaded = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
}

export interface PlayerHookReturn {
  iframeRef: RefObject<HTMLIFrameElement>;
  ready: boolean;
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: number;
  isFullscreen: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (r: number) => void;
}

export function useYouTubePlayer(videoId: string): PlayerHookReturn {
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const playerRef    = useRef<YT.Player | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevVolRef   = useRef(70);
  // Ref síncrono para togglePlay — evita chamar getPlayerState() em instância inválida
  const isPlayingRef = useRef(false);

  const [ready,          setReady]          = useState(false);
  const [state,          setState]          = useState<PlayerState>('idle');
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolumeState]    = useState(70);
  const [muted,          setMuted]          = useState(false);
  const [playbackRate,   setPlaybackRateState] = useState(1);
  const [buffered,       setBuffered]       = useState(0);
  const [isFullscreen,   setIsFullscreen]   = useState(false);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        setCurrentTime(p.getCurrentTime?.() ?? 0);
        setDuration(p.getDuration?.() ?? 0);
        setVolumeState(p.getVolume?.() ?? 70);
        setMuted(p.isMuted?.() ?? false);
        setBuffered((p.getVideoLoadedFraction?.() ?? 0) * (p.getDuration?.() ?? 0));
      } catch {}
    }, 250);
  }, []);

  useEffect(() => {
    let destroyed = false;
    // Reseta estado ao trocar de vídeo
    isPlayingRef.current = false;
    setReady(false);
    setState('idle');
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);

    loadYouTubeAPI().then(() => {
      if (destroyed || !iframeRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (e: YT.PlayerEvent) => {
            if (destroyed) return;
            e.target.setVolume(70);
            setReady(true);
            setState('idle');
            setDuration(e.target.getDuration());
            startPolling();
          },
          onStateChange: (e: YT.OnStateChangeEvent) => {
            if (destroyed) return;
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING) {
              isPlayingRef.current = true;
              setState('playing');
            } else if (s === window.YT.PlayerState.PAUSED) {
              isPlayingRef.current = false;
              setState('paused');
            } else if (s === window.YT.PlayerState.ENDED) {
              isPlayingRef.current = false;
              setState('ended');
            } else if (s === window.YT.PlayerState.BUFFERING) {
              setState('loading');
            } else if (s === window.YT.PlayerState.CUED) {
              isPlayingRef.current = false;
              setState('idle');
            }
          },
          onPlaybackRateChange: (e: YT.OnPlaybackRateChangeEvent) => setPlaybackRateState(e.data),
          onError: () => { isPlayingRef.current = false; setState('error'); },
        },
      });
    });

    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);

    return () => {
      destroyed = true;
      isPlayingRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('fullscreenchange', handleFs);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, startPolling]);

  const play  = useCallback(() => { try { playerRef.current?.playVideo();  } catch {} }, []);
  const pause = useCallback(() => { try { playerRef.current?.pauseVideo(); } catch {} }, []);

  // Usa isPlayingRef em vez de getPlayerState() — seguro mesmo durante troca de episódio
  const togglePlay = useCallback(() => {
    try {
      if (isPlayingRef.current) playerRef.current?.pauseVideo();
      else                      playerRef.current?.playVideo();
    } catch {}
  }, []);

  const seek = useCallback((s: number) => {
    try { playerRef.current?.seekTo(s, true); } catch {}
  }, []);

  const setVolume = useCallback((v: number) => {
    try {
      playerRef.current?.setVolume(v);
      if (v > 0) { playerRef.current?.unMute(); setMuted(false); }
      setVolumeState(v);
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.isMuted()) { p.unMute(); p.setVolume(prevVolRef.current); setMuted(false); }
      else { prevVolRef.current = p.getVolume(); p.mute(); setMuted(true); }
    } catch {}
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    try { playerRef.current?.setPlaybackRate(r); } catch {}
  }, []);

  return {
    iframeRef, ready, state, currentTime, duration,
    volume, muted, playbackRate, buffered, isFullscreen,
    play, pause, togglePlay, seek, setVolume, toggleMute, setPlaybackRate,
  };
}
