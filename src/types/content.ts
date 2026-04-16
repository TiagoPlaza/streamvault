export type ContentType = 'movie' | 'series';
export type ContentStatus = 'published' | 'draft' | 'archived';
export type ContentRating = 'L' | '10' | '12' | '14' | '16' | '18';
export type VideoProvider = 'youtube' | 'vimeo';

export interface VideoSource {
  provider: VideoProvider;
  videoId: string;
}
export interface PreviewSource {
  previewProvider: VideoProvider;
  previewId: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  originalTitle?: string;
  description: string;
  longDescription?: string;
  year: number;
  duration?: number; // para filmes
  seasons?: number; // para séries
  totalEpisodes?: number; // para séries
  genres: string[];
  rating: ContentRating;
  score: number;
  popularity: number;
  status: ContentStatus;
  featured: boolean;
  thumbnail: string;
  backdrop: string;
  previewSource?: PreviewSource;
  videoSource?: VideoSource;
  cast: string[];
  director?: string;
  country: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt:string;
}

export interface Episode {
  id: string;
  seriesId: string;
  season: number;
  episode: number;
  title: string;
  description: string;
  duration?: number;
  thumbnail?: string;
  videoSource?: VideoSource;
  releaseDate?: string;
  openingStart?: string;
  openingEnd?: string;
}