# 🎬 StreamVault

**StreamVault** é uma plataforma de streaming de vídeo *on-demand* (VOD) moderna e performática, desenvolvida com **Next.js 14+ (App Router)**. O projeto oferece suporte completo para filmes e séries, autenticação segura com controle de acesso (RBAC), e um painel administrativo robusto.

## 🚀 Tecnologias

- **Frontend:** React, Next.js (App Router), TypeScript, CSS Modules.
- **Backend:** Next.js API Routes (Serverless functions).
- **Banco de Dados:** SQLite (via `better-sqlite3`).
- **Autenticação:** JWT (JSON Web Tokens) com `jose` (Edge Compatible) e `bcryptjs`.
- **Player:** Integração customizada com YouTube IFrame API e Vimeo Player SDK.

## 📦 Instalação e Execução

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configuração de Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto (opcional para desenvolvimento, o sistema possui fallback):
    ```env
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

3.  **Inicialize o Banco de Dados:**
    ```bash
    npm run db:seed     # Popula o banco com dados iniciais
    ```

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Acesse http://localhost:3000.

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

A estrutura segue o padrão do Next.js App Router, organizada por domínios de funcionalidade:

```text
src/
├── app/                    # Rotas e páginas da aplicação
│   ├── admin/              # Área administrativa (protegida por middleware)
│   ├── api/                # API Routes (Backend-for-Frontend)
│   ├── login/              # Página de Login/Registro
│   ├── watch/[id]/         # Player principal (Lógica de Filmes e Séries)
│   └── page.tsx            # Home page
├── components/             # Componentes React reutilizáveis
│   ├── admin/              # Componentes específicos do Admin (Layout, etc)
│   └── VideoPlayer.tsx     # Componente de player universal (YouTube/Vimeo)
├── hooks/                  # Custom Hooks (Lógica de estado e efeitos)
├── lib/                    # Bibliotecas auxiliares e configurações
│   ├── auth.ts             # Gestão de Sessão/JWT (Edge Runtime Compatible)
│   ├── db.ts               # Conexão Singleton com SQLite
│   └── user-repository.ts  # Data Access Layer de Usuários (Node Runtime)
├── services/               # Fetch wrappers para comunicação com a API
├── types/                  # Definições de tipos TypeScript globais
└── middleware.ts           # Proteção de rotas (Edge Middleware)
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
