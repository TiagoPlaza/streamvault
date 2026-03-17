'use client';
import React, { useState, useRef, useEffect } from 'react';
import { VideoSource } from '@/types/content';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useVimeoPlayer, type VimeoPlayerHookReturn } from '@/hooks/useVimeoPlayer';
import PlayerControls from './PlayerControls';
import styles from './VideoPlayer.module.css';

interface Props {
  source: VideoSource;
  autoplay?: boolean;
  title?: string;
  thumbnail?: string;
  onStateChange?: (isPlaying: boolean) => void;
}

function YouTubeEmbed({ source, autoplay, title, thumbnail, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(autoplay ?? false)
  const player = useYouTubePlayer(source.videoId);

  useEffect(() => { if (autoplay && player.ready) player.play(); }, [autoplay, player.ready]);
  useEffect(() => { onStateChange?.(player.state === 'playing'); }, [player.state]);

  // const iframeUrl = `https://www.youtube.com/embed/${source.videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
  const iframeUrl = `https://www.youtube.com/embed/${source.videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`

  const thumbDefalth = `https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg`

  console.log("Player: ", player)
  return (
    <div ref={containerRef} className={styles.wrap} onClick={() => player.togglePlay()}>
      {/* <iframe ref={player.iframeRef} src={iframeUrl} className={styles.iframe}
        allowFullScreen allow="autoplay; encrypted-media" title={title ?? 'Video'} />
      {!player.ready && <div className={styles.loading}><div className={styles.spinner} /></div>}
      {player.state === 'ended' && (
        <div className={styles.ended} onClick={e => { e.stopPropagation(); player.seek(0); player.play(); }}>
          <div className={styles.replay}><ReplayIcon /><span>Assistir novamente</span></div>
        </div>
      )}
      <PlayerControls
        state={player.state} currentTime={player.currentTime} duration={player.duration}
        volume={player.volume} muted={player.muted} playbackRate={player.playbackRate}
        buffered={player.buffered} isFullscreen={player.isFullscreen} containerRef={containerRef}
        onTogglePlay={player.togglePlay} onSeek={player.seek}
        onVolumeChange={player.setVolume} onToggleMute={player.toggleMute}
        onPlaybackRateChange={player.setPlaybackRate} onToggleFullscreen={() => {}}
      /> */}
      {/* Thumbnail antes do vídeo iniciar */}
      {!started && player.state === 'idle' && (
        <div
          className={styles.thumbnail}
          onClick={() => setStarted(true)}
        >
          <img src={thumbnail ? thumbnail : thumbDefalth} alt={title ?? 'Video'} />

          <div className={styles.playButton}>
            ▶
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
        state={player.state} currentTime={player.currentTime} duration={player.duration}
        volume={player.volume} muted={player.muted} playbackRate={player.playbackRate}
        buffered={player.buffered} isFullscreen={player.isFullscreen} containerRef={containerRef}
        onTogglePlay={player.togglePlay} onSeek={player.seek}
        onVolumeChange={player.setVolume} onToggleMute={player.toggleMute}
        onPlaybackRateChange={player.setPlaybackRate} onToggleFullscreen={() => {}}
      />
    </div>
  );
}

function VimeoEmbed({ source, autoplay, title, thumbnail, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(autoplay ?? false)
  const player = useVimeoPlayer(source.videoId);

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
        state={player.state} currentTime={player.currentTime} duration={player.duration}
        volume={player.volume} muted={player.muted} playbackRate={player.playbackRate}
        buffered={player.buffered} isFullscreen={player.isFullscreen} containerRef={containerRef}
        onTogglePlay={player.togglePlay} onSeek={player.seek}
        onVolumeChange={player.setVolume} onToggleMute={player.toggleMute}
        onPlaybackRateChange={player.setPlaybackRate} onToggleFullscreen={() => {}}
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
const PlayIcon = () => <svg viewBox="0 0 330 330" fill="currentColor" width="28" height="28"><path id="XMLID_308_" d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
	c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
	C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z"></path>
</svg>