import type { Episode } from '@/types/content';

// A estrutura de payload esperada pela API de histórico
export interface RecordWatchHistoryPayload {
  userId: string;
  contentId: string;
  episodeId?: string;
  secondsWatched: number;
  completed: boolean;
}

// Uma interface genérica para a resposta padrão das nossas APIs
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Registra um evento de visualização no histórico do usuário.
 * @param payload - Os dados do evento de visualização.
 */
export async function recordWatchHistory(payload: RecordWatchHistoryPayload): Promise<void> {
  try {
    const response = await fetch('/api/watch-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro ao registrar histórico de visualização:", errorData.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error("Falha na requisição para registrar histórico de visualização:", error);
  }
}

/**
 * Busca os episódios de uma determinada série.
 * @param seriesId - O ID da série.
 * @returns Uma promessa que resolve para um array de episódios ou um array vazio em caso de erro.
 */
export async function getEpisodesForSeries(seriesId: string): Promise<Episode[]> {
  try {
    const response = await fetch(`/api/content/${seriesId}/episodes`);
    const json: ApiResponse<Episode[]> = await response.json();
    return (json.ok && json.data) ? json.data : [];
  } catch (error) {
    console.error("Falha na requisição para buscar episódios:", error);
    return [];
  }
}