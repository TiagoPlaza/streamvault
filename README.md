# 🎬 StreamVault

**StreamVault** é uma plataforma VOD moderna construída com **Next.js 14+ (App Router)** e **TypeScript**. O projeto combina um catálogo de filmes e séries com uma home personalizada, controle administrativo, autenticação JWT e persistência SQLite.

## 🚀 Tecnologias

- **Frontend:** React, Next.js App Router, TypeScript, CSS Modules.
- **Backend:** Next.js API Routes + rota de middleware para proteção de `/admin`.
- **Banco de Dados:** SQLite usando `better-sqlite3`.
- **Autenticação:** JWT com `jose`, cookies HTTP-only e controle RBAC para admins.
- **Player:** suporte a YouTube e Vimeo via componentes personalizados.

## 📦 Instalação e Execução

1. Instale as dependências:
    ```bash
    npm install
    ```

2. Crie `.env.local` (opcional):
    ```env
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

3. Popule o banco de dados:
    ```bash
    npm run db:seed
    ```

4. Execute em modo desenvolvimento:
    ```bash
    npm run dev
    ```

5. Acesse a aplicação:
    ```text
    http://localhost:3000
    ```

## 🧩 Visão geral do projeto

### Principais áreas

- `/` — Home personalizada com linhas de conteúdo e blocos `Top 10`.
- `/browse` — Catálogo de conteúdo com filtros por tipo, gênero, busca e ordenação.
- `/watch/[id]` — Player de filme/série com informações do título.
- `/admin` — Painel administrativo protegido por middleware.
- `/login` — Autenticação e registro para acesso ao admin.

### Fluxo de dados

- `ContentContext` busca conteúdos via `/api/content` e fornece gerenciamento global de estado.
- Home page consome `/api/home?userId=...` e resolve as linhas de conteúdo já combinadas com `Top10`.
- Browse page carrega gêneros de `/api/genres` para montar filtros dinâmicos.

## 🗂️ Estrutura principal

```text
src/
├── app/
│   ├── admin/           # Painel administrativo
│   ├── api/             # Endpoints do backend
│   ├── browse/          # Página de exploração de catálogo
│   ├── login/           # Login / registro
│   ├── watch/[id]/      # Player e detalhes do conteúdo
│   ├── page.tsx         # Home pública
│   └── bk-page.tsx      # Página de teste/biblioteca adicional
├── components/          # Componentes React reutilizáveis
├── context/             # Conteúdo global e cache local
├── hooks/               # Hooks customizados
├── lib/                 # Repositórios, DB, auth e personalização
├── services/            # Serviços de dados (gêneros, etc.)
├── types/               # Tipos TypeScript
└── middleware.ts        # Proteção de rotas administrativas
```

## 🗃️ Banco de dados

- `src/lib/db.ts` — conexão singleton SQLite.
- `src/lib/db-init.ts` — migrações e esquema inicial.
- `scripts/seed.ts` — popula conteúdo, gêneros, usuários e home rows.
- `src/lib/content-repository.ts` — CRUD e listagem de conteúdo.

## 🔌 API Routes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/content` | Lista conteúdos com filtros (`status`, `type`, `genre`, `search`, `orderBy`, `order`, `limit`, `offset`) |
| POST | `/api/content` | Cria novo conteúdo |
| GET | `/api/content/:id` | Busca conteúdo por ID |
| PUT | `/api/content/:id` | Atualiza conteúdo |
| DELETE | `/api/content/:id` | Remove conteúdo |
| PATCH | `/api/content/:id/featured` | Alterna destaque |
| PATCH | `/api/content/:id/status` | Alterna status entre `published`/`draft` |
| GET | `/api/home` | Resolve home personalizada com linhas e Top 10 |
| GET | `/api/genres` | Lista gêneros ativos |
| POST | `/api/genres` | Cria novo gênero |
| GET | `/api/home-rows` | Lista home rows para admin |
| POST | `/api/home-rows` | Cria nova home row |
| GET | `/api/users` | Lista usuários (admin) |
| GET | `/api/auth/me` | Retorna usuário logado |
| POST | `/api/auth/login` | Login admin/user |
| POST | `/api/auth/register` | Registro de usuário |
| POST | `/api/auth/logout` | Logout e exclusão do cookie |
| GET | `/api/stats` | Métricas do dashboard admin |
| GET | `/api/seed` | Popula dados de seed via HTTP (dev) |

> A aplicação também possui rotas REST adicionais para gestão de episódios, usuários, `home-rows/[id]`, `genres/[id]` e mais.

## 🛡️ Segurança e admin

- O middleware protege todas as rotas que começam com `/admin`.
- O primeiro usuário criado no banco recebe role `admin`.
- Sessão é gerada com JWT e salva em cookie HTTP-only.
- O admin pode gerenciar:
  - Conteúdo
  - Gêneros
  - Home rows (incluindo `top10` com metadata de período e tipo)
  - Usuários

## 📌 Destaques do projeto

- Home personalizada com `Top10` calculado por visualizações e filtros.
- Busca e navegação avançada em `/browse` com filtros dinâmicos de gênero.
- Painel admin completo com edição de conteúdo, status e destaque.
- Autenticação JWT compatível com runtime Edge.

## 📜 Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run db:seed
npm run db:seed:force
npm run db:reset
```

## 💡 Observações

- Use `JWT_SECRET` no `.env.local` para garantir tokens seguros.
- O seed inicial cria dados de exemplo para conteúdo, gêneros e usuários.
- Se quiser adaptar para produção, substitua o driver SQLite por uma solução compatível com Vercel/Turso.
