import { randomUUID } from "crypto";
import fs from "fs";

const API_KEY = "2b269b3d7bfacfb8934eeee70fe138fe";
const BASE_URL = "https://api.themoviedb.org/3";

function escapeString(str) {
  return (str || "")
    .replace(/'/g, "''")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ");
}

// 🎭 Buscar gêneros
async function getGenres() {
  const url = `${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`;

  const res = await fetch(url);
  const data = await res.json();

  const genresMap = {};

  data.genres.forEach(g => {
    genresMap[g.id] = g.name;
  });

  return genresMap;
}

// 🔞 Buscar classificação indicativa
async function getRating(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // Procura a certificação do Brasil (BR)
    const brazilRelease = data.results.find(r => r.iso_3166_1 === "BR");
    
    if (brazilRelease && brazilRelease.release_dates.length > 0) {
      // Retorna a primeira certificação encontrada para o BR
      const certification = brazilRelease.release_dates.find(d => d.certification !== "")?.certification;
      return certification || "L"; // "L" como fallback (Livre)
    }
    
    return "L"; 
  } catch (error) {
    return "L";
  }
}

// 🎬 Buscar videos das série
async function getSeriesVideos(seriesId) {

  const url = `${BASE_URL}/movie/${seriesId}/videos?api_key=${API_KEY}&language=pt-BR`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results || [];

}

// 🎬 Buscar séries populares
async function getSeries(page = 1) {
  const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=${page}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results;
}

// 📺 Detalhes da série
async function getSeriesDetails(seriesId) {
  const url = `${BASE_URL}/movie/${seriesId}?api_key=${API_KEY}&language=pt-BR`;

  const res = await fetch(url);
  return await res.json();
}

// 🧾 Série → SQL
function formatSeriesToSQL(series, genresMap, id, videoProvider, videoId, rating) {

  const genres = series.genre_ids
    .map(g => genresMap[g])
    .filter(Boolean);

  return `(
    '${id}',
    'movie',
    '${escapeString(series.title)}',
    '${escapeString(series.original_title)}',
    '${escapeString(series.overview)}',
    NULL,
    ${series.release_date ? series.release_date.split("-")[0] : 2024},
    NULL,
    NULL,
    NULL,
    '${escapeString(JSON.stringify(genres))}',
    '${rating}',
    ${series.vote_average || 7.0},
    ${Math.floor(series.popularity || 0)},
    'published',
    0,
    '${series.backdrop_path ? `https://image.tmdb.org/t/p/w500${series.backdrop_path}` : ""}',
    '${series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : ""}',
    ${videoProvider ? `'${videoProvider.toLowerCase()}'` : "NULL"},
    ${videoId ? `'${videoId}'` : "NULL"},
    '[]',
    NULL,
    'Internacional',
    'Português',
    '[]'
  )`;
}


// 🚀 Gerar SQL
export default async function generateSQL() {

  try {

    let seriesSQL = [];
    let episodesSQL = [];

    console.log("🔄 Buscando gêneros...");
    const genresMap = await getGenres();

    console.log("🎬 Buscando séries...");

    for (let i = 1; i <= 5; i++) {

      const seriesList = await getSeries(i);

      for (const series of seriesList) {

        const seriesUUID = randomUUID();

        console.log(`📺 Série: ${series.name}`);

        // 1. Buscar a classificação real
        const rating = await getRating(series.id)

        // detalhes da série
        const details = await getSeriesDetails(series.id);

        // buscar vídeos
        const videos = await getSeriesVideos(series.id);

        const trailer = videos.find(
          v => v.site === "YouTube" && v.type === "Trailer"
        );

        let videoProvider = null;
        let videoId = null;

        if (trailer) {
          videoProvider = trailer.site;
          videoId = trailer.key;
        }

        // SQL da série
        seriesSQL.push(
          formatSeriesToSQL(series, genresMap, seriesUUID, videoProvider, videoId, rating)
        );

      }

    }

    console.log(`✅ Séries: ${seriesSQL.length}`);

    const sqlContent = `

BEGIN TRANSACTION;

INSERT INTO content (
  id,
  type,
  title,
  original_title,
  description,
  long_description,
  year,
  duration,
  seasons,
  total_episodes,
  genres,
  rating,
  score,
  popularity,
  status,
  featured,
  thumbnail,
  backdrop,
  preview_provider,
  preview_id,
  cast,
  director,
  country,
  language,
  tags
) VALUES
${seriesSQL.join(",\n")};

COMMIT;
`;

    fs.writeFileSync("filme_content_seed.sql", sqlContent);

    console.log("📦 seed.sql gerado com sucesso!");

    return ;

  } catch (error) {

    console.error("❌ Erro:", error);

  }

}