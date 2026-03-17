/**
 * seed.ts — Popula o banco com dados iniciais
 *
 * Rodado via: npm run db:seed
 * Usa tsx para executar TypeScript diretamente
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { initSchema } from '../src/lib/db-init';
import { createContent } from '../src/lib/content-repository';

// Setup manual para o script (fora do Next.js)
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'streamvault.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Override do singleton para o script
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
initSchema(db);

// Injeta o db no global para o repositório usar
(globalThis as unknown as { _db: Database.Database })._db = db;

const SEED_DATA = [
  {
    type: 'movie' as const,
    title: 'Big Buck Bunny',
    originalTitle: 'Big Buck Bunny',
    description: 'Um coelho enfrenta três esquilos travessos em uma floresta mágica. Uma animação épica da Blender Foundation.',
    longDescription: 'Big Buck Bunny conta a história de um coelho gentil e enorme que é provocado por três esquilos travessos até que decide revidar. Uma animação de curta-metragem open source criada pela Blender Foundation.',
    year: 2008, duration: 10,
    genres: ['Animação', 'Comédia', 'Família'],
    rating: 'L' as const, score: 8.2, popularity: 4200000,
    status: 'published' as const, featured: true,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    backdrop: 'https://peach.blender.org/wp-content/uploads/title_02_rod.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'aqz-KE-bpKQ' },
    cast: ['Blender Artists'], director: 'Sacha Goedegebure',
    country: 'Holanda', language: 'Sem diálogo',
    tags: ['open-source', 'animação', 'blender'],
  },
  {
    type: 'movie' as const,
    title: 'Elephant Dream',
    originalTitle: 'Elephants Dream',
    description: 'Dois personagens exploram uma máquina fantástica em um mundo surrealista de engrenagens.',
    year: 2006, duration: 11,
    genres: ['Animação', 'Ficção Científica', 'Arte'],
    rating: 'L' as const, score: 7.5, popularity: 1800000,
    status: 'published' as const, featured: false,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Elephants_Dream_s5_both.jpg/800px-Elephants_Dream_s5_both.jpg',
    backdrop: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Elephants_Dream_s5_both.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'TLkA0RELQ1g' },
    cast: ['Cas Jansen', 'Tygo Gernandt'], director: 'Bassam Kurdali',
    country: 'Holanda', language: 'Inglês',
    tags: ['open-source', 'surrealismo', 'blender'],
  },
  {
    type: 'movie' as const,
    title: 'Tears of Steel',
    description: 'Em Amsterdã, guerreiros e cientistas tentam reverter o domínio de robôs sobre a humanidade.',
    year: 2012, duration: 12,
    genres: ['Ficção Científica', 'Ação', 'Drama'],
    rating: '12' as const, score: 7.8, popularity: 3100000,
    status: 'published' as const, featured: true,
    thumbnail: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
    backdrop: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'R6MlUcmOul8' },
    cast: ['Derek de Lint', 'Sergio Hasselbaink'], director: 'Ian Hubert',
    country: 'Holanda', language: 'Inglês',
    tags: ['scifi', 'vfx', 'blender'],
  },
  {
    type: 'movie' as const,
    title: 'Cosmos Laundromat',
    description: 'Uma ovelha solitária encontra um misterioso agente que lhe oferece uma segunda chance.',
    year: 2015, duration: 13,
    genres: ['Animação', 'Fantasia', 'Comédia'],
    rating: 'L' as const, score: 8.0, popularity: 2500000,
    status: 'published' as const, featured: false,
    thumbnail: 'https://cloud.blender.org/p/cosmos-laundromat/images/Poster_A_HD.jpg',
    backdrop: 'https://cloud.blender.org/p/cosmos-laundromat/images/Poster_A_HD.jpg',
    videoSource: { provider: 'vimeo' as const, videoId: '136272706' },
    cast: ['Animação: Blender Institute'], director: 'Francesco Siddi',
    country: 'Holanda', language: 'Inglês',
    tags: ['sheep', 'surreal', 'blender'],
  },
  {
    type: 'movie' as const,
    title: 'Glass Half',
    description: 'Um curta-metragem lírico sobre perspectivas e como enxergamos o mundo ao redor.',
    year: 2020, duration: 8,
    genres: ['Documentário', 'Arte', 'Experimental'],
    rating: 'L' as const, score: 7.2, popularity: 450000,
    status: 'published' as const, featured: false,
    thumbnail: 'https://i.vimeocdn.com/video/931164078_1280',
    backdrop: 'https://i.vimeocdn.com/video/931164078_1280',
    videoSource: { provider: 'vimeo' as const, videoId: '76979871' },
    cast: ['Desconhecido'], country: 'Internacional', language: 'Sem diálogo',
    tags: ['experimental', 'poético'],
  },
  {
    type: 'movie' as const,
    title: 'Agent 327',
    originalTitle: 'Agent 327: Operation Barbershop',
    description: 'O famoso agente secreto holandês enfrenta uma missão perigosa em uma barbearia suspeita.',
    year: 2017, duration: 3,
    genres: ['Animação', 'Ação', 'Comédia'],
    rating: '12' as const, score: 8.6, popularity: 5800000,
    status: 'published' as const, featured: true,
    thumbnail: 'https://agent327.com/wp-content/uploads/2017/05/A327_KeyArt_v08.jpg',
    backdrop: 'https://agent327.com/wp-content/uploads/2017/05/A327_KeyArt_v08.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'mN0zPOpADL4' },
    cast: ['Blender Institute'], director: 'Hjalti Hjalmarsson',
    country: 'Holanda', language: 'Sem diálogo',
    tags: ['ação', 'espião', 'blender'],
  },
  {
    type: 'movie' as const,
    title: 'Sprite Fright',
    description: 'Um grupo de adolescentes invade uma floresta encantada e encontra criaturas hostis.',
    year: 2021, duration: 8,
    genres: ['Animação', 'Terror', 'Comédia'],
    rating: '12' as const, score: 8.3, popularity: 3400000,
    status: 'published' as const, featured: false,
    thumbnail: 'https://www.blender.org/wp-content/uploads/2021/10/sprite-fright-poster.jpg',
    backdrop: 'https://www.blender.org/wp-content/uploads/2021/10/sprite-fright-poster.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'jn-xbSQGPkc' },
    cast: ['Blender Studio'], director: 'Mathieu Auvray',
    country: 'Holanda', language: 'Inglês',
    tags: ['terror', 'fantasia', 'sprites'],
  },
  {
    type: 'movie' as const,
    title: 'Wing It!',
    description: 'Dois pombos aventureiros tentam aprender a voar de maneiras cada vez mais desastrosas.',
    year: 2022, duration: 5,
    genres: ['Animação', 'Comédia', 'Família'],
    rating: 'L' as const, score: 7.6, popularity: 980000,
    status: 'draft' as const, featured: false,
    thumbnail: 'https://www.blender.org/wp-content/uploads/2022/01/CapaWingIt.jpg',
    backdrop: 'https://www.blender.org/wp-content/uploads/2022/01/CapaWingIt.jpg',
    videoSource: { provider: 'youtube' as const, videoId: 'WhWc3b3KhnY' },
    cast: ['Blender Studio'], country: 'Holanda', language: 'Sem diálogo',
    tags: ['pombos', 'comédia'],
  },
  {
    type: 'series' as const,
    title: 'Blender Chronicles',
    description: 'Série documental sobre os bastidores da criação de animações 3D profissionais.',
    year: 2022, seasons: 2, totalEpisodes: 12,
    genres: ['Documentário', 'Tecnologia', 'Arte'],
    rating: 'L' as const, score: 8.4, popularity: 1600000,
    status: 'published' as const, featured: false,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Blender_logo_no_text.svg/1200px-Blender_logo_no_text.svg.png',
    backdrop: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
    cast: ['Ton Roosendaal'], country: 'Internacional', language: 'Inglês',
    tags: ['blender', '3d', 'making-of'],
  },
  {
    type: 'movie' as const,
    title: 'Caminhos da Natureza',
    description: 'Uma jornada visual pelos ecossistemas mais remotos do planeta.',
    year: 2019, duration: 45,
    genres: ['Documentário', 'Natureza'],
    rating: 'L' as const, score: 8.7, popularity: 2200000,
    status: 'published' as const, featured: true,
    thumbnail: 'https://i.vimeocdn.com/video/601064198_1280',
    backdrop: 'https://i.vimeocdn.com/video/601064198_1280',
    videoSource: { provider: 'vimeo' as const, videoId: '45370926' },
    cast: ['Nature Films'], director: 'Nature Studios',
    country: 'Internacional', language: 'Inglês',
    tags: ['natureza', 'documentário'],
  },
];

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Verifica se já tem dados
  const existing = db.prepare('SELECT COUNT(*) as n FROM content').get() as { n: number };
  if (existing.n > 0) {
    console.log(`⚠️  Banco já tem ${existing.n} registros.`);
    const answer = process.argv.includes('--force');
    if (!answer) {
      console.log('   Use --force para recriar os dados.');
      process.exit(0);
    }
    db.exec('DELETE FROM content');
    console.log('   Dados anteriores removidos.\n');
  }

  let count = 0;
  for (const item of SEED_DATA) {
    createContent(item);
    console.log(`   ✓ ${item.title}`);
    count++;
  }

  console.log(`\n✅ Seed concluído! ${count} títulos inseridos.`);
  console.log(`   Banco: ${DB_PATH}`);
  db.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
