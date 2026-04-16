'use client';
import React, { useState, useRef, useEffect } from 'react';
import { VideoSource } from '@/types/content';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useVimeoPlayer, type VimeoPlayerHookReturn } from '@/hooks/useVimeoPlayer';
import PlayerControls from './PlayerControls';
import { useWatchTracker } from '@/hooks/useWatchTracker';
import styles from './VideoPlayer.module.css';

interface Props {
  source: VideoSource;
  autoplay?: boolean;
  title?: string;
  thumbnail?: string;
  openingStart?: number; // Tempo inicial da abertura (em segundos)
  openingEnd?: number;   // Tempo final da abertura (em segundos)
  onStateChange?: (isPlaying: boolean) => void;
}

function YouTubeEmbed({ source, autoplay, title, thumbnail, openingStart, openingEnd, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(autoplay ?? false)
  const player = useYouTubePlayer(source.videoId);

  useWatchTracker({
    contentId: source.videoId, // Idealmente seria o ID do conteúdo, mas usando videoId por compatibilidade
    currentTime: player.currentTime,
    isPlaying: player.state === 'playing',
    onLoadProgress: (seconds) => { if (player.ready) player.seek(seconds); }
  });

  useEffect(() => { if (autoplay && player.ready) player.play(); }, [autoplay, player.ready]);
  useEffect(() => { onStateChange?.(player.state === 'playing'); }, [player.state]);

  // const iframeUrl = `https://www.youtube.com/embed/${source.videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
  const iframeUrl = `https://www.youtube.com/embed/${source.videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`

  const thumbDefalth = `https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg`

  return (
    <div ref={containerRef} className={styles.wrap} onClick={() => player.togglePlay()}>
      {/* Thumbnail antes do vídeo iniciar */}
      {!started && player.state === 'idle' && (
        <div
          className={styles.thumbnail}
          onClick={() => setStarted(true)}
        >
          <img src={thumbnail ? thumbnail : thumbDefalth} alt={title ?? 'Video'} />

          <div className={styles.playButton}>
            <PlayIcon/>
          </div>
        </div>
      )}
        <iframe ref={player.iframeRef} src={iframeUrl} className={styles.iframe}
        allowFullScreen allow="autoplay; encrypted-media" title={title ?? 'Video'} />
      {!player.ready && <div className={styles.loading}><div className={styles.spinner} /></div>}
      {player.state === 'ended' && (
        <div className={styles.ended} onClick={e => { e.stopPropagation(); player.seek(0); player.play(); }}>
          <div className={styles.replay}><ReplayIcon /><span>Assistir novamente</span></div>
        </div>
      )}
      <PlayerControls
        state={player.state}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        muted={player.muted}
        playbackRate={player.playbackRate}
        buffered={player.buffered}
        isFullscreen={player.isFullscreen}
        openingStart={openingStart}
        openingEnd={openingEnd}
        containerRef={containerRef}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleMute={player.toggleMute}
        onPlaybackRateChange={player.setPlaybackRate}
        onToggleFullscreen={() => {}}
      />
    </div>
  );
}

function VimeoEmbed({ source, autoplay, title, thumbnail, openingStart, openingEnd, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(autoplay ?? false)
  const player = useVimeoPlayer(source.videoId);

  useWatchTracker({
    contentId: source.videoId,
    currentTime: player.currentTime,
    isPlaying: player.state === 'playing',
    onLoadProgress: (seconds) => { if (player.ready) player.seek(seconds); }
  });

  useEffect(() => { if (autoplay && player.ready) player.play(); }, [autoplay, player.ready]);
  useEffect(() => { onStateChange?.(player.state === 'playing'); }, [player.state]);

  return (
    <div ref={containerRef} className={styles.wrap} onClick={() => player.togglePlay()}>
      {!started && player.state === 'idle' && (
        <div
          className={styles.thumbnail}
          onClick={() => setStarted(true)}
        >
          <img src={thumbnail} alt={title ?? 'Video'} />

          <div className={styles.playButton}>
            <PlayIcon/>
          </div>
        </div>
      )}
      {/* O SDK do Vimeo cria o <iframe> dentro deste div — não usamos src estático */}
      <div
        ref={(player as VimeoPlayerHookReturn).mountRef}
        className={styles.vimeoMount}
        title={title ?? 'Video'}
      />
      {!player.ready && <div className={styles.loading}><div className={styles.spinner} /></div>}
      {player.state === 'ended' && (
        <div className={styles.ended} onClick={e => { e.stopPropagation(); player.seek(0); player.play(); }}>
          <div className={styles.replay}><ReplayIcon /><span>Assistir novamente</span></div>
        </div>
      )}
      <PlayerControls
        state={player.state}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        muted={player.muted}
        playbackRate={player.playbackRate}
        buffered={player.buffered}
        isFullscreen={player.isFullscreen}
        openingStart={openingStart}
        openingEnd={openingEnd}
        containerRef={containerRef}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleMute={player.toggleMute}
        onPlaybackRateChange={player.setPlaybackRate}
        onToggleFullscreen={() => {}}
      />
    </div>
  );
}

export default function VideoPlayer(props: Props) {
  if (props.source.provider === 'youtube') return <YouTubeEmbed key={props.source.videoId} {...props} />;
  if (props.source.provider === 'vimeo') return <VimeoEmbed {...props} />;
  return null;
}

const ReplayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>;
const PlayIcon = () => <svg viewBox="0 0 48 48" fill="currentColor" width="48" height="48"><path d="M39.72 22.26L15.72 10.26C15.12 9.95997 14.4 9.98997 13.83 10.35C13.26 10.71 12.9 11.34 12.9 12L12.9 36C12.9 36.69 13.26 37.29 13.83 37.65C14.13 37.83 14.49 37.95 14.85 37.95C15.15 37.95 15.45 37.89 15.72 37.74L39.72 25.74C40.38 25.41 40.8 24.75 40.8 24C40.8 23.25 40.38 22.59 39.72 22.26Z" /></svg>
