'use client';
import React, { useState, useCallback } from 'react';
import { parseVideoUrl } from '@/utils/helpers';
import styles from './EpisodesEditor.module.css';

export interface EpisodeDraft {
  _key: string;        // chave local para React key (não vai ao banco)
  season: number;
  episode: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  releaseDate: string;
}

interface Props {
  episodes: EpisodeDraft[];
  onChange: (episodes: EpisodeDraft[]) => void;
}

function blankEpisode(season: number, episode: number): EpisodeDraft {
  return {
    _key: `${Date.now()}_${Math.random()}`,
    season, episode,
    title: '', description: '', duration: '',
    thumbnail: '', videoUrl: '', releaseDate: '',
  };
}

// Agrupa por temporada
function groupByseason(episodes: EpisodeDraft[]): Map<number, EpisodeDraft[]> {
  const map = new Map<number, EpisodeDraft[]>();
  for (const ep of episodes) {
    if (!map.has(ep.season)) map.set(ep.season, []);
    map.get(ep.season)!.push(ep);
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

// Subcomponente de linha de episódio — fora do EpisodesEditor para evitar perda de foco
interface EpRowProps {
  ep: EpisodeDraft;
  onUpdate: (key: string, field: keyof EpisodeDraft, value: string | number) => void;
  onDelete: (key: string) => void;
  isOpen: boolean;
  onToggle: (key: string) => void;
}

function EpRow({ ep, onUpdate, onDelete, isOpen, onToggle }: EpRowProps) {
  const videoError = ep.videoUrl && !parseVideoUrl(ep.videoUrl);

  return (
    <div className={styles.epCard}>
      <div className={styles.epHeader} onClick={() => onToggle(ep._key)}>
        <div className={styles.epMeta}>
          <span className={styles.epNum}>
            T{ep.season} · E{ep.episode}
          </span>
          <span className={styles.epTitle}>
            {ep.title || <em className={styles.epTitleEmpty}>Sem título</em>}
          </span>
          {ep.duration && <span className={styles.epDur}>{ep.duration}min</span>}
        </div>
        <div className={styles.epActions}>
          <button
            className={styles.epDeleteBtn}
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(ep._key); }}
            title="Remover episódio"
          >✕</button>
          <span className={styles.epChevron}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className={styles.epBody}>
          <div className={styles.epGrid2}>
            <div className={styles.epField}>
              <label className={styles.epLabel}>Título *</label>
              <input
                className={styles.epInput}
                value={ep.title}
                onChange={e => onUpdate(ep._key, 'title', e.target.value)}
                placeholder="Nome do episódio"
              />
            </div>
            <div className={styles.epField}>
              <label className={styles.epLabel}>Duração (min)</label>
              <input
                className={styles.epInput}
                type="number"
                value={ep.duration}
                onChange={e => onUpdate(ep._key, 'duration', e.target.value)}
                placeholder="45"
                min={1}
              />
            </div>
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Descrição</label>
            <textarea
              className={styles.epTextarea}
              value={ep.description}
              onChange={e => onUpdate(ep._key, 'description', e.target.value)}
              placeholder="Sinopse do episódio"
              rows={2}
            />
          </div>

          <div className={styles.epGrid2}>
            <div className={styles.epField}>
              <label className={styles.epLabel}>URL do vídeo (YouTube / Vimeo)</label>
              <input
                className={`${styles.epInput} ${videoError ? styles.epInputError : ''}`}
                value={ep.videoUrl}
                onChange={e => onUpdate(ep._key, 'videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              {videoError && <span className={styles.epError}>URL inválida</span>}
            </div>
            <div className={styles.epField}>
              <label className={styles.epLabel}>Data de lançamento</label>
              <input
                className={styles.epInput}
                type="date"
                value={ep.releaseDate}
                onChange={e => onUpdate(ep._key, 'releaseDate', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Thumbnail URL</label>
            <input
              className={styles.epInput}
              value={ep.thumbnail}
              onChange={e => onUpdate(ep._key, 'thumbnail', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EpisodesEditor({ episodes, onChange }: Props) {
  const [openKeys, setOpenKeys]     = useState<Set<string>>(new Set());
  const [newSeason, setNewSeason]   = useState(1);

  const toggleOpen = useCallback((key: string) => {
    setOpenKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const updateField = useCallback((key: string, field: keyof EpisodeDraft, value: string | number) => {
    onChange(episodes.map(ep => ep._key === key ? { ...ep, [field]: value } : ep));
  }, [episodes, onChange]);

  const deleteEp = useCallback((key: string) => {
    onChange(episodes.filter(ep => ep._key !== key));
  }, [episodes, onChange]);

  const addEpisode = useCallback(() => {
    const inSeason = episodes.filter(ep => ep.season === newSeason);
    const nextEp   = inSeason.length > 0
      ? Math.max(...inSeason.map(e => e.episode)) + 1
      : 1;
    const draft = blankEpisode(newSeason, nextEp);
    onChange([...episodes, draft]);
    // Abre automaticamente o novo episódio
    setOpenKeys(prev => new Set([...prev, draft._key]));
  }, [episodes, onChange, newSeason]);

  const addSeason = useCallback(() => {
    const maxSeason = episodes.length > 0
      ? Math.max(...episodes.map(e => e.season))
      : 0;
    const season = maxSeason + 1;
    setNewSeason(season);
    const draft = blankEpisode(season, 1);
    onChange([...episodes, draft]);
    setOpenKeys(prev => new Set([...prev, draft._key]));
  }, [episodes, onChange]);

  const grouped = groupByseason(episodes);

  return (
    <div className={styles.root}>

      {/* Header com contador */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          Episódios
          {episodes.length > 0 && (
            <span className={styles.count}>{episodes.length}</span>
          )}
        </span>
        <div className={styles.headerActions}>
          {grouped.size > 0 && (
            <div className={styles.addEpRow}>
              <span className={styles.addEpLabel}>Adicionar na T</span>
              <input
                className={styles.seasonInput}
                type="number"
                value={newSeason}
                onChange={e => setNewSeason(Math.max(1, Number(e.target.value)))}
                min={1}
              />
              <button type="button" className={styles.btnSecondary} onClick={addEpisode}>
                + Episódio
              </button>
            </div>
          )}
          <button type="button" className={styles.btnPrimary} onClick={addSeason}>
            + Nova temporada
          </button>
        </div>
      </div>

      {/* Estado vazio */}
      {episodes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📺</div>
          <p>Nenhum episódio adicionado.</p>
          <p className={styles.emptyHint}>Clique em "+ Nova temporada" para começar.</p>
        </div>
      )}

      {/* Grupos por temporada */}
      {[...grouped.entries()].map(([season, eps]) => (
        <div key={season} className={styles.seasonGroup}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonLabel}>Temporada {season}</span>
            <span className={styles.seasonEpCount}>
              {eps.length} episódio{eps.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.epList}>
            {eps.map(ep => (
              <EpRow
                key={ep._key}
                ep={ep}
                onUpdate={updateField}
                onDelete={deleteEp}
                isOpen={openKeys.has(ep._key)}
                onToggle={toggleOpen}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
