'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import ContentCard from '@/components/ContentCard';
import { recordWatchHistory, getEpisodesForSeries } from '@/services/api-client.service';
import { useContent } from '@/context/ContentContext';
import { formatDuration, formatViews, formatDate } from '@/utils/helpers';
import type { Episode } from '@/types/content';
import { getRatingColor } from '@/lib/rate-limit';
import { useUserId } from '@/hooks/useUserId';
import styles from './page.module.css';

// ─── Episódios: lista de uma temporada ────────────────────────────────────────

interface EpisodeListProps {
  episodes: Episode[];
  currentId: string;
  onSelect: (ep: Episode) => void;
}

function EpisodeList({ episodes, currentId, onSelect }: EpisodeListProps) {
  // Mostra todos menos o que está tocando
  const visible = episodes.filter(ep => ep.id !== currentId);
  if (episodes.length === 0) return (
    <p className={styles.epEmpty}>Todos os episódios desta temporada já foram exibidos.</p>
  );
  return (
    <div className={styles.epList}>
      {episodes.map(ep => (
        <button 
          key={ep.id} 
          className={`${styles.epCard} ${ep.id === currentId ? styles.epCardActive : ''}`}
          onClick={() => onSelect(ep)}
        >
          <div className={styles.epThumb}>
            {ep.thumbnail
              ? <img src={ep.thumbnail} alt={ep.title} className={styles.epThumbImg} />
              : <div className={styles.epThumbBlank}><span>▶</span></div>
            }
          </div>
          <div className={styles.epInfo}>
            <span className={styles.epNum}>Ep. {ep.episode}</span>
            <span className={styles.epTitle}>{ep.title}</span>
            {(ep.duration ?? 0) > 0 && <span className={styles.epDur}>{ep.duration}min</span>}
          </div>
          {ep.description && <div className={styles.epDesc}>{ep.description}</div>}
        </button>
      ))}
    </div>
  );
}

// ─── Seletor de temporada ─────────────────────────────────────────────────────

interface SeasonTabsProps {
  seasons: number[];
  active: number;
  onChange: (s: number) => void;
}

function SeasonTabs({ seasons, active, onChange }: SeasonTabsProps) {
  if (seasons.length <= 1) return null;
  return (
    <div className={styles.seasonTabs}>
      {seasons.map(s => (
        <button
          key={s}
          className={`${styles.seasonTab} ${s === active ? styles.seasonTabActive : ''}`}
          onClick={() => onChange(s)}
        >
          T{s}
        </button>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function WatchPage() {
  const { id }          = useParams<{ id: string }>();
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const { items, getById } = useContent();
  const item            = getById(id);

  const userId = useUserId();
  const [isPlaying, setIsPlaying] = useState(false);

  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [loadingEps, setLoadingEps]   = useState(false);
  const [currentEp, setCurrentEp]     = useState<Episode | null>(null);
  const [activeSeason, setActiveSeason] = useState(1);

  /**
   * Converte uma string de tempo (HH:mm:ss ou mm:ss) para o total de segundos.
   * Exemplo: "00:03:58" -> 238 segundos
   */
  const timeToSeconds = (timeString: string | undefined): number => {
    if (!timeString) return 0;

    // Divide a string em partes [HH, MM, SS]
    const parts = timeString.split(':').map(Number);
    
    let seconds = 0;

    if (parts.length === 3) {
      // Formato HH:MM:SS
      const [hours, minutes, secs] = parts;
      seconds = (hours * 3600) + (minutes * 60) + secs;
    } else if (parts.length === 2) {
      // Formato MM:SS
      const [minutes, secs] = parts;
      seconds = (minutes * 60) + secs;
    } else if (parts.length === 1) {
      // Apenas SS
      seconds = parts[0];
    }

    return seconds;
  }

  useEffect(() => {
    // 1. Bloqueios de segurança: só prossegue se tiver usuário e o item principal
    if (!userId || !item) return;

    // 2. Preparação dos dados conforme a estrutura da API
    const isSeries = item.type === 'series';
    
    // Se for série, precisamos esperar o currentEp carregar para não enviar ID nulo
    if (isSeries && !currentEp) return;

    // SUGESTÃO: Este efeito atualmente registra apenas o *início* da visualização.
    // O hook `useWatchTracker` (importado mas não usado) deve ser implementado
    // para monitorar o progresso do vídeo e enviar atualizações periódicas
    // com o `secondsWatched` real para a API, e marcar como `completed`.
    recordWatchHistory({
      userId,
      contentId: id, // O ID da série ou do filme (ID pai)
      episodeId: isSeries ? currentEp?.id : undefined, // ID específico se for série
      secondsWatched: 0, // Placeholder, deve ser atualizado pelo `useWatchTracker`
      completed: false
    });

    // O efeito deve rodar sempre que o ID do conteúdo principal ou do episódio mudar.
    // Usar `item.type` em vez do objeto `item` inteiro evita re-execuções desnecessárias.
  }, [id, userId, currentEp?.id, item?.type]);

  const epIdFromUrl = searchParams.get('ep');

  // Carrega episódios da série
  useEffect(() => {
    const loadEpisodes = async () => {
      if (!item || item.type !== 'series') return;
      setLoadingEps(true);
      try {
        const eps = await getEpisodesForSeries(id);
        if (eps.length > 0) {
          setAllEpisodes(eps);
          // Episódio da URL (?ep=ID) ou primeiro episódio
          const target = epIdFromUrl
            ? eps.find(e => e.id === epIdFromUrl)
            : eps[0];
          if (target) {
            setCurrentEp(target);
            setActiveSeason(target.season);
          }
        }
      } finally {
        setLoadingEps(false);
      }
    };
    loadEpisodes();
  }, [id, item, epIdFromUrl]);

  // Temporadas disponíveis
  const seasons = useMemo(
    () => Array.from(new Set(allEpisodes.map(e => e.season))).sort((a, b) => a - b),
    [allEpisodes]
  );

  // Episódios da temporada ativa
  const episodesInSeason = useMemo(
    () => allEpisodes.filter(e => e.season === activeSeason).sort((a, b) => a.episode - b.episode),
    [allEpisodes, activeSeason]
  );

  function selectEpisode(ep: Episode) {
    setCurrentEp(ep);
    setActiveSeason(ep.season);
    // Atualiza URL sem reload
    router.replace(`/watch/${id}?ep=${ep.id}`, { scroll: false });
  }

  // ── Fonte de vídeo atual ────────────────────────────────────────────────────
  const videoSource = item?.type === 'series'
    ? currentEp?.videoSource
    : item?.videoSource;

  // ── Conteúdo relacionado ────────────────────────────────────────────────────
  const related = useMemo(() => items.filter(i =>
    i.id !== item?.id &&
    i.status === 'published' &&
    i.genres.some(g => item?.genres.includes(g))
  ).slice(0, 8), [items, item]);

  if (!item) return (
    <div className={styles.notFound}>
      <Navbar />
      <div className={styles.notFoundInner}>
        <span className={styles.nfIcon}>◌</span>
        <h2>Conteúdo não encontrado</h2>
        <Link href="/" className={styles.nfLink}>← Voltar ao início</Link>
      </div>
    </div>
  );

  const isSeries = item.type === 'series';
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.inner}>

        {/* ── Layout série: player + lista lado a lado ── */}
        {isSeries ? (
          <div className={styles.seriesLayout}>

            {/* Coluna esquerda: player + info */}
            <div className={styles.seriesMain}>

              {/* Player */}
              <div className={styles.playerSection}>
                {loadingEps ? (
                  <div className={styles.playerLoading}>
                    <div className={styles.spinner} />
                  </div>
                ) : videoSource ? (
                  <>
                    <VideoPlayer 
                      source={videoSource}
                      title={currentEp?.title ?? item.title} 
                      thumbnail={item?.thumbnail} 
                      onStateChange={setIsPlaying} 
                      openingStart={currentEp?.openingStart ? timeToSeconds(currentEp?.openingStart) : 0}
                      openingEnd={currentEp?.openingEnd ? timeToSeconds(currentEp?.openingEnd) : 0}
                    />
                    {currentEp && (
                      <div className={styles.nowPlaying}>
                        <span className={styles.nowBadge}>▶ Assistindo</span>
                        <span className={styles.nowTitle}>
                          T{currentEp.season} · Ep.{currentEp.episode} — {currentEp.title}
                        </span>
                      </div>
                    )}
                  </>
                ) : allEpisodes && allEpisodes.length > 0 && (
                  <div className={styles.noVideo}>
                    <span>▶</span>
                    <p>{allEpisodes.length === 0 ? 'Esta série ainda não tem episódios cadastrados' : 'Episódio sem vídeo disponível'}</p>
                  </div>
                )}
              </div>

              {/* Info da série */}
              <div className={styles.seriesInfo}>
                <div className={styles.badges}>
                  <span className={styles.typeBadge}>Série</span>
                  <span 
                    className={styles.ratingBadge}
                    style={getRatingColor(item.rating)}
                  >{item.rating}</span>
                  {item.featured && <span className={styles.featBadge}>✦ Destaque</span>}
                </div>
                <h1 className={styles.title}>{item.title}</h1>
                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className={styles.originalTitle}>{item.originalTitle}</p>
                )}
                <div className={styles.metaRow}>
                  <span className={styles.year}>{item.year}</span>
                  {item.seasons && <><span className={styles.dot}>·</span><span>{item.seasons} temp.</span></>}
                  {item.totalEpisodes && <><span className={styles.dot}>·</span><span>{item.totalEpisodes} ep.</span></>}
                  <span className={styles.dot}>·</span>
                  <span className={styles.score}>★ {item.score.toFixed(1)}</span>
                </div>
                <div className={styles.genres}>
                  {item.genres.map(g => <span key={g} className={styles.genre}>{g}</span>)}
                </div>
                <p className={styles.description}>{item.longDescription ?? item.description}</p>
                <div className={styles.details}>
                  {item.director && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Direção</span>
                      <span className={styles.detailValue}>{item.director}</span>
                    </div>
                  )}
                  {item.cast.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Elenco</span>
                      <span className={styles.detailValue}>{item.cast.join(', ')}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>País</span>
                    <span className={styles.detailValue}>{item.country}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Idioma</span>
                    <span className={styles.detailValue}>{item.language}</span>
                  </div>
                </div>
                {item.tags.length > 0 && (
                  <div className={styles.tags}>
                    {item.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita: lista de episódios */}
            <aside className={styles.episodesSidebar}>
              <div className={styles.sidebarHeader}>
                <h3 className={styles.sidebarTitle}>Episódios</h3>
                <SeasonTabs seasons={seasons} active={activeSeason} onChange={setActiveSeason} />
              </div>

              {loadingEps ? (
                <div className={styles.epsLoading}>Carregando...</div>
              ) : allEpisodes.length === 0 ? (
                <p className={styles.epEmpty}>Nenhum episódio cadastrado.</p>
              ) : (
                <EpisodeList
                  episodes={episodesInSeason}
                  currentId={currentEp?.id ?? ''}
                  onSelect={selectEpisode}
                />
              )}
            </aside>
          </div>

        ) : (
          /* ── Layout filme: original ── */
          <>
            <div className={styles.playerSection}>
              {videoSource ? (
                <VideoPlayer source={videoSource} title={item.title} onStateChange={setIsPlaying} thumbnail={item.thumbnail} />
              ) : (
                <div className={styles.noVideo}>
                  <span>▶</span>
                  <p>Vídeo não disponível para este título</p>
                </div>
              )}
            </div>

            <div className={styles.infoSection}>
              <div className={styles.mainInfo}>
                <div className={styles.badges}>
                  <span className={styles.typeBadge}>Filme</span>
                  <span 
                    className={styles.ratingBadge}
                    style={getRatingColor(item.rating)}
                  >{item.rating}</span>
                  {item.featured && <span className={styles.featBadge}>✦ Destaque</span>}
                </div>
                <h1 className={styles.title}>{item.title}</h1>
                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className={styles.originalTitle}>{item.originalTitle}</p>
                )}
                <div className={styles.metaRow}>
                  <span className={styles.year}>{item.year}</span>
                  {item.duration && <><span className={styles.dot}>·</span><span>{formatDuration(item.duration)}</span></>}
                  <span className={styles.dot}>·</span>
                  <span className={styles.score}>★ {item.score.toFixed(1)}</span>
                  <span className={styles.dot}>·</span>
                  <span>{formatViews(item.popularity)} views</span>
                </div>
                <div className={styles.genres}>
                  {item.genres.map(g => <span key={g} className={styles.genre}>{g}</span>)}
                </div>
                <p className={styles.description}>{item.longDescription ?? item.description}</p>
                <div className={styles.details}>
                  {item.director && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Direção</span>
                      <span className={styles.detailValue}>{item.director}</span>
                    </div>
                  )}
                  {item.cast.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Elenco</span>
                      <span className={styles.detailValue}>{item.cast.join(', ')}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>País</span>
                    <span className={styles.detailValue}>{item.country}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Idioma</span>
                    <span className={styles.detailValue}>{item.language}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Adicionado</span>
                    <span className={styles.detailValue}>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                {item.tags.length > 0 && (
                  <div className={styles.tags}>
                    {item.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
                  </div>
                )}
              </div>

              {related.length > 0 && (
                <div className={styles.related}>
                  <h3 className={styles.relatedTitle}>Você também pode gostar</h3>
                  <div className={styles.relatedGrid}>
                    {related.map(r => <ContentCard key={r.id} item={r} size="sm" />)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Relacionados abaixo para séries */}
        {isSeries && related.length > 0 && (
          <div className={styles.relatedRow}>
            <h3 className={styles.relatedTitle}>Você também pode gostar</h3>
            <div className={styles.relatedGrid}>
              {related.map(r => <ContentCard key={r.id} item={r} size="sm" />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
