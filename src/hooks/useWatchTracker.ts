import { useEffect, useRef } from 'react';

interface UseWatchTrackerProps {
  contentId: string;
  currentTime: number;
  isPlaying: boolean;
  onLoadProgress?: (seconds: number) => void;
}

export function useWatchTracker({ contentId, currentTime, isPlaying, onLoadProgress }: UseWatchTrackerProps) {
  const lastSavedTime = useRef(0);
  const SAVE_INTERVAL = 10; // Salvar a cada 10 segundos de diferença

  // Carregar progresso inicial
  useEffect(() => {
    if (!contentId) return;
    
    fetch(`/api/watch-history?contentId=${contentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.seconds > 0) {
          if (onLoadProgress) onLoadProgress(data.data.seconds);
          lastSavedTime.current = data.data.seconds;
        }
      })
      .catch(console.error);
  }, [contentId]);

  // Salvar progresso
  useEffect(() => {
    if (!isPlaying || !contentId) return;

    // Só salva se avançou X segundos desde o último save
    if (Math.abs(currentTime - lastSavedTime.current) >= SAVE_INTERVAL) {
      const timeToSave = Math.floor(currentTime);
      
      fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, seconds: timeToSave }),
      }).then(() => {
        lastSavedTime.current = timeToSave;
      }).catch(console.error);
    }
  }, [currentTime, isPlaying, contentId]);
}