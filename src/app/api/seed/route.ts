/**
 * GET /api/seed  → popula o banco via requisição HTTP (apenas em dev)
 *
 * Acesse http://localhost:3000/api/seed para popular o banco sem rodar
 * o script manualmente. Útil na primeira vez.
 */

import { NextRequest } from 'next/server';
import { createContent, listContent } from '@/lib/content-repository';
import { seedGenres, listGenres } from '@/services/genre.service';
import { ok, err } from '../_helpers';
import type { ContentRating, ContentStatus, ContentType } from '@/types/content';

if (process.env.NODE_ENV === 'production') {
  // Não expor em produção
}

const SEED_DATA = [
  {
    type: 'movie' as ContentType, title: 'Big Buck Bunny',
    description: 'Um coelho enfrenta três esquilos travessos em uma floresta mágica.',
    year: 2008, duration: 10, genres: ['Animação', 'Comédia', 'Família'],
    rating: 'L' as ContentRating, score: 8.2, popularity: 4200000,
    status: 'published' as ContentStatus, featured: true,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    backdrop: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'aqz-KE-bpKQ' },
    cast: ['Blender Artists'], director: 'Sacha Goedegebure',
    country: 'Holanda', language: 'Sem diálogo', tags: ['open-source', 'animação'],
  },
  {
    type: 'movie' as ContentType, title: 'Tears of Steel',
    description: 'Guerreiros e cientistas tentam reverter o domínio de robôs em Amsterdã.',
    year: 2012, duration: 12, genres: ['Ficção Científica', 'Ação'],
    rating: '12' as ContentRating, score: 7.8, popularity: 3100000,
    status: 'published' as ContentStatus, featured: true,
    thumbnail: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
    backdrop: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'R6MlUcmOul8' },
    cast: ['Derek de Lint'], director: 'Ian Hubert',
    country: 'Holanda', language: 'Inglês', tags: ['scifi', 'vfx'],
  },
  {
    type: 'movie' as ContentType, title: 'Agent 327',
    description: 'O agente secreto holandês enfrenta missão perigosa em barbearia suspeita.',
    year: 2017, duration: 3, genres: ['Animação', 'Ação', 'Comédia'],
    rating: '12' as ContentRating, score: 8.6, popularity: 5800000,
    status: 'published' as ContentStatus, featured: true,
    thumbnail: 'https://agent327.com/wp-content/uploads/2017/05/A327_KeyArt_v08.jpg',
    backdrop: 'https://agent327.com/wp-content/uploads/2017/05/A327_KeyArt_v08.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'mN0zPOpADL4' },
    cast: ['Blender Institute'], director: 'Hjalti Hjalmarsson',
    country: 'Holanda', language: 'Sem diálogo', tags: ['ação', 'espião'],
  },
  {
    type: 'movie' as ContentType, title: 'Cosmos Laundromat',
    description: 'Uma ovelha solitária encontra um agente misterioso que oferece uma segunda chance.',
    year: 2015, duration: 13, genres: ['Animação', 'Fantasia'],
    rating: 'L' as ContentRating, score: 8.0, popularity: 2500000,
    status: 'published' as ContentStatus, featured: false,
    thumbnail: 'https://cloud.blender.org/p/cosmos-laundromat/images/Poster_A_HD.jpg',
    backdrop: 'https://cloud.blender.org/p/cosmos-laundromat/images/Poster_A_HD.jpg',
    videoSource: { provider: 'vimeo' as const, videoId: '136272706' },
    cast: ['Blender Institute'], director: 'Francesco Siddi',
    country: 'Holanda', language: 'Inglês', tags: ['sheep', 'surreal'],
  },
  {
    type: 'series' as ContentType, title: 'Blender Chronicles',
    description: 'Série documental sobre os bastidores da criação de animações 3D.',
    year: 2022, seasons: 2, totalEpisodes: 12, genres: ['Documentário', 'Tecnologia'],
    rating: 'L' as ContentRating, score: 8.4, popularity: 1600000,
    status: 'published' as ContentStatus, featured: false,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Blender_logo_no_text.svg/800px-Blender_logo_no_text.svg.png',
    backdrop: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
    cast: ['Ton Roosendaal'], country: 'Internacional', language: 'Inglês',
    tags: ['blender', '3d'],
  },
];

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return err('Seed desabilitado em produção', 403);
  }

  const force = req.nextUrl.searchParams.has('force');

  // Sempre garante que os gêneros padrão existam
  // (INSERT OR IGNORE — seguro rodar múltiplas vezes)
  const GENRE_NAMES = [
    'Animação', 'Ação', 'Aventura', 'Arte', 'Comédia', 'Drama',
    'Documentário', 'Experimental', 'Família', 'Fantasia',
    'Ficção Científica', 'Natureza', 'Tecnologia', 'Terror',
  ];
  seedGenres(GENRE_NAMES);

  const { total } = listContent();
  if (total > 0 && !force) {
    return ok({ message: `Banco já tem ${total} registros. Use ?force=true para recriar.`, total });
  }

  const created = [];
  for (const data of SEED_DATA) {
    const item = createContent(data);
    created.push(item.title);
  }

  return ok({ message: `${created.length} itens criados com sucesso!`, items: created });
}
