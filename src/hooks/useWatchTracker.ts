'use client';
/**
 * useWatchTracker
 *
 * Rastreia o tempo assistido e envia para /api/watch-history.
 * Deve ser montado na página /watch/[id].
 *
 * Estratégia:
 * - A cada 30s de reprodução, envia um heartbeat
 * - Ao desmontar, envia o tempo acumulado final
 */

import { useEffect, useRef } from 'react';
import { getUserId } from './useUserId';

interface Props {
  contentId: string;
  episodeId?: string;
  isPlaying: boolean;
}

export function useWatchTracker({ contentId, episodeId, isPlaying }: Props) {
  const secondsRef    = useRef(0);   // segundos acumulados nesta sessão
  const lastTickRef   = useRef<number | null>(null);
  const intervalRef   = useRef<NodeJS.Timeout | null>(null);
  const sentRef       = useRef(0);   // segundos já enviados

  async function flush(completed = false) {
    const toSend = secondsRef.current - sentRef.current;
    if (toSend < 5 && !completed) return;  // mínimo de 5s para enviar
    const userId = getUserId();
    if (!userId) return;
    sentRef.current = secondsRef.current;
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, contentId, episodeId, secondsWatched: toSend, completed }),
        keepalive: true,
      });
    } catch {}
  }

  useEffect(() => {
    // Reseta ao trocar de conteúdo
    secondsRef.current = 0;
    sentRef.current    = 0;
    lastTickRef.current = null;
  }, [contentId, episodeId]);

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (lastTickRef.current) {
          const elapsed = (Date.now() - lastTickRef.current) / 1000;
          secondsRef.current += elapsed;
          lastTickRef.current = Date.now();
        }
        // Heartbeat a cada ~30s acumulados
        if (secondsRef.current - sentRef.current >= 30) flush();
      }, 1000);
    } else {
      if (lastTickRef.current) {
        const elapsed = (Date.now() - lastTickRef.current) / 1000;
        secondsRef.current += elapsed;
        lastTickRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      flush();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, contentId, episodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush final ao desmontar
  useEffect(() => {
    return () => { flush(); };
  }, [contentId, episodeId]); // eslint-disable-line react-hooks/exhaustive-deps
}
