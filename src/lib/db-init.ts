/**
 * db-init.ts — Schema e migrações do banco
 *
 * Abordagem simples de versionamento:
 * - Tabela `migrations` armazena as versões aplicadas
 * - Cada migração é idempotente (só roda uma vez)
 */

import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_content_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS content (
          id                TEXT    PRIMARY KEY,
          type              TEXT    NOT NULL CHECK(type IN ('movie', 'series')),
          title             TEXT    NOT NULL,
          original_title    TEXT,
          description       TEXT    NOT NULL,
          long_description  TEXT,
          year              INTEGER NOT NULL,
          duration          INTEGER,
          seasons           INTEGER,
          total_episodes    INTEGER,
          genres            TEXT    NOT NULL DEFAULT '[]',  -- JSON array
          rating            TEXT    NOT NULL DEFAULT 'L',
          score             REAL    NOT NULL DEFAULT 7.0,
          popularity        INTEGER NOT NULL DEFAULT 0,
          status            TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK(status IN ('published', 'draft', 'archived')),
          featured          INTEGER NOT NULL DEFAULT 0,    -- boolean
          thumbnail         TEXT    NOT NULL,
          backdrop          TEXT    NOT NULL DEFAULT '',
          preview_provider  TEXT,                          -- 'youtube' | 'vimeo'
          preview_id        TEXT,
          video_provider    TEXT,                          -- 'youtube' | 'vimeo'
          video_id          TEXT,
          cast              TEXT    NOT NULL DEFAULT '[]', -- JSON array
          director          TEXT,
          country           TEXT    NOT NULL DEFAULT 'Internacional',
          language          TEXT    NOT NULL DEFAULT 'Português',
          tags              TEXT    NOT NULL DEFAULT '[]', -- JSON array
          created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
          updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Índices para queries comuns
        CREATE INDEX IF NOT EXISTS idx_content_status   ON content(status);
        CREATE INDEX IF NOT EXISTS idx_content_type     ON content(type);
        CREATE INDEX IF NOT EXISTS idx_content_featured ON content(featured);
        CREATE INDEX IF NOT EXISTS idx_content_year     ON content(year DESC);
        CREATE INDEX IF NOT EXISTS idx_content_score    ON content(score DESC);
      `);
    },
  },
  {
    version: 2,
    name: 'create_updated_at_trigger',
    up: (db) => {
      db.exec(`
        -- Trigger para atualizar updated_at automaticamente
        CREATE TRIGGER IF NOT EXISTS content_updated_at
        AFTER UPDATE ON content
        FOR EACH ROW
        BEGIN
          UPDATE content SET updated_at = datetime('now') WHERE id = NEW.id;
        END;
      `);
    },
  },
  {
    version: 3,
    name: 'create_genres_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS genres (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
          slug       TEXT    NOT NULL UNIQUE,
          created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
      `);

      // Semeia gêneros padrão na mesma migração —
      // INSERT OR IGNORE garante idempotência
      const insert = db.prepare('INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)');
      const seedDefault = db.transaction(() => {
        const defaults: [string, string][] = [
          ['Ação',           'acao'],
          ['Animação',       'animacao'],
          ['Arte',           'arte'],
          ['Aventura',       'aventura'],
          ['Comédia',        'comedia'],
          ['Documentário',   'documentario'],
          ['Drama',          'drama'],
          ['Experimental',   'experimental'],
          ['Família',        'familia'],
          ['Fantasia',       'fantasia'],
          ['Ficção Científica', 'ficcao-cientifica'],
          ['Natureza',       'natureza'],
          ['Tecnologia',     'tecnologia'],
          ['Terror',         'terror'],
        ];
        for (const [name, slug] of defaults) insert.run(name, slug);
      });
      seedDefault();
    },
  },
  {
    version: 4,
    name: 'create_episodes_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS episodes (
          id           TEXT    PRIMARY KEY,
          series_id    TEXT    NOT NULL REFERENCES content(id) ON DELETE CASCADE,
          season       INTEGER NOT NULL DEFAULT 1,
          episode      INTEGER NOT NULL DEFAULT 1,
          title        TEXT    NOT NULL,
          description  TEXT    NOT NULL DEFAULT \'\',
          duration     INTEGER,
          thumbnail    TEXT    NOT NULL DEFAULT \'\',
          video_provider TEXT,
          video_id     TEXT,
          release_date TEXT,
          created_at   TEXT    NOT NULL DEFAULT (datetime(\'now\')),
          updated_at   TEXT    NOT NULL DEFAULT (datetime(\'now\')),
          UNIQUE(series_id, season, episode)
        );

        CREATE INDEX IF NOT EXISTS idx_episodes_series  ON episodes(series_id);
        CREATE INDEX IF NOT EXISTS idx_episodes_season  ON episodes(series_id, season);
      `);
    },
  },
  {
    version: 5,
    name: 'create_home_rows_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS home_rows (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          title       TEXT    NOT NULL,
          filter_type TEXT    NOT NULL DEFAULT 'genre',
          -- filter_type: genre | type | featured | tag | top10 | new | custom
          filter_value TEXT,            -- gênero, tipo, tag, etc.
          sort_by     TEXT    NOT NULL DEFAULT 'popularity',
          -- sort_by: popularity | score | year | random | top10_algo
          content_limit INTEGER NOT NULL DEFAULT 20,
          position    INTEGER NOT NULL DEFAULT 0,
          active      INTEGER NOT NULL DEFAULT 1,
          row_type    TEXT    NOT NULL DEFAULT 'standard',
          -- row_type: standard | top10
          metadata    TEXT    NOT NULL DEFAULT '{}',
          -- JSON para customizações futuras (ex: { "period": "week" } para top10)
          created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_home_rows_position ON home_rows(position);
      `);

      // Seed das linhas padrão
      const insert = db.prepare(`
        INSERT INTO home_rows (title, filter_type, filter_value, sort_by, content_limit, position, row_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const seed = db.transaction(() => {
        const rows = [
          ['Programas de Ação',                   'genre',        'Ação',                                     'popularity', 20, 1,  'standard'],
          ['Filmes de Ação, Aventura e Violência','genre_movie',  'Ação,Aventura,Terror',                     'popularity', 20, 2,  'standard'],
          ['Top 10',                              'top10',        null,                                       'top10_algo', 10, 3,  'top10'],
          ['Séries de Ação e Aventura',           'genre_series', 'Ação,Aventura',                            'popularity', 20, 4,  'standard'],
          ['Novidades',                           'new',          null,                                       'year',       20, 5,  'standard'],
          ['Comédias para a TV',                  'genre_series', 'Comédia',                                  'score',      20, 6,  'standard'],
          ['Top 10 de Hoje',                      'top10',        null,                                       'top10_algo', 10, 7,  'top10'],
          ['Chega de Tédio',                      'genre',        'Comédia,Aventura,Família,Animação',        'random',     20, 8,  'standard'],
          ['Para Ver e Relaxar',                  'genre',        'Documentário,Natureza,Drama',              'score',      20, 9,  'standard'],
          ['Anime',                               'genre', 'Anime',                                    'popularity', 20, 10, 'standard'],
          ['Só Aqui',                             'featured',     null,                                       'score',      20, 11, 'standard'],
          ['Embarque na Ação',                    'genre',        'Ação,Aventura,Ficção Científica',          'score',      20, 12, 'standard'],
          ['Filmes Baseados na Vida Real',        'genre_movie',  'Documentário,Drama,Biografia',             'score',      20, 13, 'standard'],
          ['Filmes Empolgantes',                  'genre_movie',  'Ficção Científica,Ação,Aventura,Fantasia', 'score',      20, 14, 'standard'],
          ['Filmes infantis',                     'genre_movie',  'anime,Desenho,Infantil',                   'popularity', 20, 15, 'standard']
        ];
        for (const r of rows) insert.run(...r);
      });
      seed();
    },
  },
  {
    version: 6,
    name: 'create_viewing_history_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS viewing_history (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id         TEXT    NOT NULL,
          content_id      TEXT    NOT NULL REFERENCES content(id) ON DELETE CASCADE,
          episode_id      TEXT,
          seconds_watched INTEGER NOT NULL DEFAULT 0,
          completed       INTEGER NOT NULL DEFAULT 0,
          last_watched_at TEXT    NOT NULL DEFAULT (datetime('now')),
          hour_of_day     INTEGER NOT NULL DEFAULT 0,
          UNIQUE(user_id, content_id, episode_id)
        );
        CREATE INDEX IF NOT EXISTS idx_history_user    ON viewing_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_history_content ON viewing_history(content_id);
        CREATE INDEX IF NOT EXISTS idx_history_watched ON viewing_history(user_id, last_watched_at DESC);
      `);
    },
  },
  {
    version: 7,
    name: 'create_user_preferences_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id         TEXT    PRIMARY KEY,
          genre_scores    TEXT    NOT NULL DEFAULT '{}',  -- JSON: { "Ação": 15, "Drama": 8 }
          usage_hours     TEXT    NOT NULL DEFAULT '{}',  -- JSON: { "20": 12, "21": 8 }  (hora -> minutos)
          total_watched   INTEGER NOT NULL DEFAULT 0,
          updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
];

export function initSchema(db: Database.Database): void {
  // Cria tabela de controle de migrações
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version   INTEGER PRIMARY KEY,
      name      TEXT    NOT NULL,
      run_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const getApplied = db.prepare('SELECT version FROM migrations WHERE version = ?');
  const insertHistory = db.prepare('INSERT INTO migrations (version, name) VALUES (?, ?)');

  // Ordena por version antes de executar — garante ordem correta
  // independente de como estão declaradas no array
  const sorted = [...MIGRATIONS].sort((a, b) => a.version - b.version);

  for (const migration of sorted) {
    const applied = getApplied.get(migration.version);
    if (!getApplied.get(migration.version)) {
      db.transaction(() => {
        migration.up(db);
        insertHistory.run(migration.version, migration.name);
      })();
    }
  }
}
