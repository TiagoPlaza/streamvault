'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentItem, ContentType, ContentStatus, ContentRating } from '@/types/content';
import { useContent } from '@/context/ContentContext';
import { parseVideoUrl } from '@/utils/helpers';
import { RATINGS, COUNTRIES, LANGUAGES } from '@/lib/mockData';
import EpisodesEditor, { type EpisodeDraft } from './EpisodesEditor';
import styles from './ContentForm.module.css';

interface Props { initial?: ContentItem; mode: 'create' | 'edit'; }

interface GenreOption { id: number; name: string; }

const defaultForm = {
  type: 'movie' as ContentType, 
  title: '', originalTitle: '', 
  description: '',
  longDescription: '', 
  year: new Date().getFullYear(), 
  duration: 90 as number | undefined,
  seasons: undefined as number | undefined, 
  totalEpisodes: undefined as number | undefined,
  genres: [] as string[], 
  rating: '14' as ContentRating, 
  score: 7.0,
  popularity: 0, 
  status: 'draft' as ContentStatus, 
  featured: false,
  thumbnail: '', 
  backdrop: '', 
  videoUrl: '',
  previewUrl: '',
  openingStart: '',
  openingEnd: '',
  cast: '', 
  director: '', 
  country: 'Internacional', 
  language: 'Português',
  tags: '',
};

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export default function ContentForm({ initial, mode }: Props) {
  const router = useRouter();
  const { addItem, updateItem } = useContent();

  const [form, setForm] = useState(() => initial ? {
    type: initial.type, 
    title: initial.title, 
    originalTitle: initial.originalTitle ?? '',
    description: initial.description, 
    longDescription: initial.longDescription ?? '',
    year: initial.year, 
    duration: initial.duration, 
    seasons: initial.seasons,
    totalEpisodes: initial.totalEpisodes, 
    genres: [...initial.genres],
    rating: initial.rating, 
    score: initial.score, 
    popularity: initial.popularity,
    status: initial.status, 
    featured: initial.featured,
    thumbnail: initial.thumbnail, 
    backdrop: initial.backdrop,
    videoUrl: initial.videoSource
      ? `https://${initial.videoSource.provider === 'youtube' ? 'youtube.com/watch?v=' : 'vimeo.com/'}${initial.videoSource.videoId}`
      : '',
    previewUrl: initial.previewSource
      ? `https://${initial.previewSource.previewProvider === 'youtube' ? 'youtube.com/watch?v=' : 'vimeo.com/'}${initial.previewSource.previewId}`
      : '',
    cast: initial.cast.join(', '), 
    director: initial.director ?? '',
    country: initial.country, 
    language: initial.language,
    tags: initial.tags.join(', '),
  } : defaultForm);

  const [genreOptions, setGenreOptions] = useState<GenreOption[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/genres')
      .then(r => r.json())
      .then(json => { if (json.ok) setGenreOptions(json.data); })
      .catch(() => {});
    // Se for edição de série, carrega episódios existentes
    if (initial?.id && initial.type === 'series') {
      fetch(`/api/content/${initial.id}/episodes`)
        .then(r => r.json())
        .then(json => {
          if (json.ok) {
            setEpisodes(json.data.map((ep: {
              id: string; season: number; 
              episode: number; 
              title: string;
              description: string; 
              duration: number;
              thumbnail: string; 
              videoSource?: { provider: string; videoId: string };
              releaseDate: string;
            }) => ({
              _key: ep.id,
              season: ep.season,
              episode: ep.episode,
              title: ep.title,
              description: ep.description,
              duration: ep.duration ? String(ep.duration) : '',
              thumbnail: ep.thumbnail,
              videoUrl: ep.videoSource
                ? `https://${ep.videoSource.provider === 'youtube' ? 'youtube.com/watch?v=' : 'vimeo.com/'}${ep.videoSource.videoId}`
                : '',
              releaseDate: ep.releaseDate ?? '',
              openingStart: ep.openingStart ?? '',
              openingEnd: ep.openingEnd ?? '',
            })));
          }
        })
        .catch(() => {});
    }
  }, []);

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const toggleGenre = (g: string) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Título é obrigatório';
    if (!form.description.trim()) e.description = 'Descrição é obrigatória';
    if (!form.thumbnail.trim()) e.thumbnail = 'Thumbnail é obrigatória';
    if (form.genres.length === 0) e.genres = 'Selecione ao menos 1 gênero';
    if (form.videoUrl && !parseVideoUrl(form.videoUrl)) e.videoUrl = 'URL inválida (YouTube ou Vimeo)';
    if (form.previewUrl && !parseVideoUrl(form.previewUrl)) e.previewUrl = 'URL inválida (YouTube ou Vimeo)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async

    const videoSource = form.videoUrl ? parseVideoUrl(form.videoUrl) ?? undefined : undefined;
    const previewSource = form.previewUrl ? parseVideoUrl(form.previewUrl) ?? undefined : undefined;
    const data = {
      type: form.type, 
      title: form.title.trim(), 
      originalTitle: form.originalTitle || undefined,
      description: form.description.trim(), 
      longDescription: form.longDescription || undefined,
      year: form.year, 
      duration: form.type === 'movie' ? form.duration : undefined,
      seasons: form.type === 'series' ? form.seasons : undefined,
      totalEpisodes: form.type === 'series' ? form.totalEpisodes : undefined,
      genres: form.genres, 
      rating: form.rating, 
      score: form.score,
      popularity: form.popularity, 
      status: form.status, 
      featured: form.featured,
      thumbnail: form.thumbnail.trim(), 
      backdrop: form.backdrop.trim() || form.thumbnail.trim(),
      videoSource,
      previewSource, 
      cast: form.cast.split(',').map(s => s.trim()).filter(Boolean),
      director: form.director || undefined, 
      country: form.country, 
      language: form.language,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };

    let savedId = initial?.id;

    if (mode === 'create') {
      const created = await addItem(data);
      savedId = created?.id;
    } else if (initial) {
      updateItem(initial.id, data);
    }

    // Salva episódios se for série
    if (form.type === 'series' && savedId) {
      const epPayload = episodes.map(ep => ({
        season:      ep.season,
        episode:     ep.episode,
        title:       ep.title,
        description: ep.description,
        duration:    ep.duration ? Number(ep.duration) : undefined,
        thumbnail:   ep.thumbnail,
        videoSource: ep.videoUrl ? parseVideoUrl(ep.videoUrl) ?? undefined : undefined,
        releaseDate: ep.releaseDate,
        openingStart: ep.openingStart,
        openingEnd: ep.openingEnd,
      }));
      await fetch(`/api/content/${savedId}/episodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes: epPayload }),
      });
    }

    router.push('/admin/content');
  };

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <F label="Título *" error={errors.title}>
          <input className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título do conteúdo" />
        </F>
        <F label="Título original">
          <input className={styles.input} value={form.originalTitle}
            onChange={e => set('originalTitle', e.target.value)} placeholder="Título no idioma original" />
        </F>
      </div>

      <div className={styles.grid3}>
        <F label="Tipo">
          <select className={styles.select} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="movie">Filme</option>
            <option value="series">Série</option>
          </select>
        </F>
        <F label="Status">
          <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value as ContentStatus)}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </F>
        <F label="Classificação">
          <select className={styles.select} value={form.rating} onChange={e => set('rating', e.target.value as ContentRating)}>
            {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </F>
      </div>

      <F label="Descrição curta *" error={errors.description}>
        <textarea className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
          rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Sinopse curta para o card" />
      </F>
      <F label="Descrição longa">
        <textarea className={styles.textarea} rows={4} value={form.longDescription}
          onChange={e => set('longDescription', e.target.value)} placeholder="Sinopse completa" />
      </F>

      <div className={styles.grid3}>
        <F label="Ano">
          <input type="number" className={styles.input} value={form.year}
            onChange={e => set('year', +e.target.value)} min={1900} max={2099} />
        </F>
        {form.type === 'movie' ? (
          <F label="Duração (min)">
            <input type="number" className={styles.input} value={form.duration ?? ''}
              onChange={e => set('duration', +e.target.value)} placeholder="90" />
          </F>
        ) : (
          <>
            <F label="Temporadas">
              <input type="number" className={styles.input} value={form.seasons ?? ''}
                onChange={e => set('seasons', +e.target.value)} placeholder="1" />
            </F>
            <F label="Total episódios">
              <input type="number" className={styles.input} value={form.totalEpisodes ?? ''}
                onChange={e => set('totalEpisodes', +e.target.value)} placeholder="10" />
            </F>
          </>
        )}
        <F label="Pontuação (0-10)">
          <input type="number" className={styles.input} value={form.score}
            onChange={e => set('score', Math.min(10, Math.max(0, +e.target.value)))} step={0.1} min={0} max={10} />
        </F>
      </div>

      {form.type === 'series' && (
        <F label="Episódios">
          <EpisodesEditor episodes={episodes} onChange={setEpisodes} />
        </F>
      )}

      <F label="Gêneros *" error={errors.genres}>
        <div className={styles.genresGrid}>
          {genreOptions.map(g => (
            <button key={g} type="button"
              className={`${styles.genreChip} ${form.genres.includes(g.name) ? styles.genreActive : ''}`}
              onClick={() => toggleGenre(g.name)}>{g.name}</button>
          ))}
        </div>
      </F>

      <div className={styles.grid2}>
        <F label="Thumbnail URL *" error={errors.thumbnail}>
          <input className={`${styles.input} ${errors.thumbnail ? styles.inputError : ''}`}
            value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="https://..." />
        </F>
        <F label="Backdrop URL">
          <input className={styles.input} value={form.backdrop}
            onChange={e => set('backdrop', e.target.value)} placeholder="https://... (opcional)" />
        </F>
      </div>

      {form.thumbnail && (
        <div className={styles.thumbPreview}>
          <img src={form.thumbnail} alt="preview" className={styles.thumbImg}
            onError={e => (e.currentTarget.style.display = 'none')} />
          <span className={styles.thumbLabel}>Preview</span>
        </div>
      )}
      <div className={styles.grid2}>
        <F label="URL do vídeo (YouTube ou Vimeo)" error={errors.videoUrl}>
          <input className={`${styles.input} ${errors.videoUrl ? styles.inputError : ''}`}
            value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..." />
        </F>

        <F label="URL do preview (YouTube ou Vimeo)" error={errors.previewUrl}>
          <input className={`${styles.input} ${errors.previewUrl ? styles.inputError : ''}`}
            value={form.previewUrl} onChange={e => set('previewUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..." />
        </F>
      </div>

      <div className={styles.grid2}>
        <F label="Elenco (separado por vírgula)">
          <input className={styles.input} value={form.cast}
            onChange={e => set('cast', e.target.value)} placeholder="Ator 1, Atriz 2, ..." />
        </F>
        <F label="Diretor">
          <input className={styles.input} value={form.director}
            onChange={e => set('director', e.target.value)} placeholder="Nome do diretor" />
        </F>
      </div>

      <div className={styles.grid2}>
        <F label="País">
          <select className={styles.select} value={form.country} onChange={e => set('country', e.target.value)}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F label="Idioma">
          <select className={styles.select} value={form.language} onChange={e => set('language', e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </F>
      </div>

      <F label="Tags (separadas por vírgula)">
        <input className={styles.input} value={form.tags}
          onChange={e => set('tags', e.target.value)} placeholder="animação, família, ..." />
      </F>

      <div className={styles.checkRow}>
        <label className={styles.checkLabel}>
          <input type="checkbox" className={styles.check} checked={form.featured}
            onChange={e => set('featured', e.target.checked)} />
          <span>✦ Marcar como destaque (aparece no Hero)</span>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={() => router.push('/admin/content')}>
          Cancelar
        </button>
        <button type="button" className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Salvando...' : mode === 'create' ? '✓ Criar conteúdo' : '✓ Salvar alterações'}
        </button>
      </div>
    </div>
  );
}
