export type ContentType = 'movie' | 'series';
export type ContentStatus = 'published' | 'draft' | 'archived';
export type VideoProvider = 'youtube' | 'vimeo';
export type ContentRating = 'L' | '10' | '12' | '14' | '16' | '18';

export interface VideoSource {
  provider: VideoProvider;
  videoId: string;
  title?: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  season: number;
  episode: number;
  title: string;
  description: string;
  duration: number; // minutes
  thumbnail: string;
  videoSource: VideoSource;
  releaseDate: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  originalTitle?: string;
  description: string;
  longDescription?: string;
  year: number;
  duration?: number; // minutes (movies)
  seasons?: number; // series
  totalEpisodes?: number;
  genres: string[];
  rating: ContentRating;
  score: number; // 0-10
  popularity: number; // views count
  status: ContentStatus;
  featured: boolean;
  thumbnail: string;
  backdrop: string;
  logo?: string;
  videoSource?: VideoSource; // for movies
  episodes?: Episode[]; // for series
  cast: string[];
  director?: string;
  country: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Category {
  id: string;
  label: string;
  filter: (items: ContentItem[]) => ContentItem[];
}

export interface AdminStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  totalViews: number;
  movies: number;
  series: number;
}
