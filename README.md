# StreamVault com SQLite

## Setup

```bash
npm install
npm run db:seed     # Popula o banco
npm run dev         # http://localhost:3000
```

Ou via browser: `http://localhost:3000/api/seed`

## Arquitetura do banco

```
src/lib/
├── db.ts                    # Singleton da conexão (WAL mode)
├── db-init.ts               # Schema + migrações versionadas
└── content-repository.ts    # Repository Pattern (CRUD + stats)
scripts/
└── seed.ts                  # Seed CLI
```

## API Routes

| Método | Rota | Ação |
|--------|------|------|
| GET | /api/content | Lista com filtros |
| POST | /api/content | Cria |
| GET | /api/content/:id | Busca por ID |
| PUT | /api/content/:id | Atualiza |
| DELETE | /api/content/:id | Remove |
| PATCH | /api/content/:id/featured | Toggle destaque |
| PATCH | /api/content/:id/status | Toggle status |
| GET | /api/stats | Métricas do dashboard |
| GET | /api/seed | Seed via HTTP (dev) |

## Scripts

```bash
npm run db:seed         # Popula (pula se já tem dados)
npm run db:seed:force   # Recria todos os dados
npm run db:reset        # Remove banco e recria
```

## Por que better-sqlite3?

- Síncrono — funciona perfeitamente com Next.js Node.js runtime
- Performance superior para operações simples
- Zero infraestrutura adicional

## Migrações

Em `db-init.ts`, array `MIGRATIONS`:

```typescript
{
  version: 3,
  name: 'add_views_table',
  up: (db) => { db.exec('CREATE TABLE views (...)') }
}
```

Cada migração roda uma única vez. Versões aplicadas ficam na tabela `migrations`.

## Produção / Serverless

Para Vercel (filesystem read-only), use **Turso** (SQLite na nuvem):

```bash
npm install @libsql/client
```

Troque `better-sqlite3` por `@libsql/client` em `db.ts`. O repositório não muda.
