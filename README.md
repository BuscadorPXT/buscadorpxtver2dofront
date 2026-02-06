# Buscador PXT v2

Plataforma de busca de produtos e gerenciamento de fornecedores com sincronizacao em tempo real via Google Sheets.

O Buscador PXT permite que usuarios busquem, comparem precos e entrem em contato com fornecedores de produtos Apple e Android. Os dados sao sincronizados automaticamente a partir de planilhas Google Sheets, e as atualizacoes sao propagadas em tempo real para todos os clientes conectados via WebSocket/SSE.

---

## Tech Stack

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | NestJS 11, TypeScript, TypeORM, PostgreSQL 16, JWT (Passport), WebSockets (Socket.IO), Google Sheets API, `@nestjs/schedule` |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, shadcn/ui (Radix UI, JSX), React Router 7, React Hook Form + Zod, Lucide Icons |
| **Infraestrutura** | Docker (multi-stage builds), CapRover, GitHub Actions CI/CD, AWS S3 / Cloudflare R2 |
| **Notificacoes** | Mailjet (email), Z-API (WhatsApp), WebSocket push |
| **Package Manager** | pnpm |

---

## Arquitetura

```
Google Sheets
     |
     v
 [Backend NestJS]  ──── Cron sync (@nestjs/schedule)
     |
     ├── PostgreSQL 16 (TypeORM, 16 entidades, 30+ migrations)
     ├── Cache em memoria + disco (AES-256 opcional)
     ├── JWT Auth + Session tracking
     ├── Notifications (email, WhatsApp, WebSocket)
     └── SSE / WebSocket Gateway
            |
            v
    [Frontend React SPA]
         ├── Busca de produtos com autocomplete
         ├── Filtros multi-select (categoria, cor, capacidade, regiao, fornecedor)
         ├── Comparacao de precos entre fornecedores
         ├── Painel administrativo
         └── Sistema de assinaturas/planos
```

### Backend (~28 modulos NestJS)

- **Auth/Users** — Autenticacao JWT, hash bcryptjs, tracking de sessao, codigo de usuario (codeId)
- **Products/Suppliers** — Entidades principais sincronizadas do Google Sheets
- **Sheets** — Integracao com Google Sheets API, sync via cron
- **Cache** — Cache em memoria + disco com criptografia AES-256 opcional
- **Notifications** — Multi-canal: email (Mailjet), WhatsApp (Z-API), WebSocket push
- **Presence** — Sessoes, page views, geolocalizacao, analytics
- **Subscriptions/Plans** — Gerenciamento de assinaturas com controle de acesso por tempo
- **Upload** — Upload de arquivos para AWS S3 / Cloudflare R2
- **Partners** — Sistema de parceiros com banners

### Frontend (React SPA)

```
frontend/src/
  ├── components/       # Componentes reutilizaveis
  │   └── ui/           # shadcn/ui (Radix + Tailwind)
  ├── pages/            # Paginas por rota
  ├── hooks/            # Custom hooks
  ├── contexts/         # AuthContext, ThemeContext
  ├── services/         # Camada API (Axios)
  └── data/             # Dados estaticos (cores, grupos de categoria)
```

- **Path alias:** `@` mapeia para `src/`
- **Componentes UI:** shadcn/ui estilo new-york (JSX, nao TSX)
- **Roteamento:** React Router com rotas protegidas; admin em `/admin/*`

---

## Como rodar

### Pre-requisitos

- Node.js 20+
- pnpm
- PostgreSQL 16
- Credenciais Google Sheets (service account)

### Variaveis de ambiente

Copie os arquivos de exemplo:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Variaveis principais:

| Variavel | Descricao |
|----------|-----------|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Conexao PostgreSQL |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID da planilha Google Sheets |
| `ENCRYPTION_KEY` / `VITE_ENCRYPTION_KEY` | Devem ser iguais, 32+ chars (AES-256) |
| `ENABLE_ENCRYPTION` / `VITE_ENABLE_ENCRYPTION` | `false` para dev |
| `CACHE_DIRECTORY` | `./cache` local, `/app/cache` no Docker |

### Desenvolvimento

```bash
# Backend (porta 3001)
cd backend
pnpm install
pnpm migrate
pnpm seed
pnpm start:dev

# Frontend (porta 5173)
cd frontend
pnpm install
pnpm dev
```

### Docker

```bash
docker compose up
```

---

## Comandos uteis

### Backend

```bash
pnpm start:dev          # Dev server com watch mode
pnpm build              # Compilar TypeScript
pnpm lint               # ESLint com auto-fix
pnpm format             # Prettier
pnpm test               # Testes unitarios (Jest)
pnpm test:e2e           # Testes E2E
pnpm migrate            # Rodar migrations SQL
pnpm seed               # Rodar seeders
```

### Frontend

```bash
pnpm dev                # Dev server Vite
pnpm build              # Build de producao
pnpm preview            # Preview do build
pnpm lint               # ESLint
```

---

## CI/CD

Deploy automatico via GitHub Actions para CapRover. Convencao de commit:

| Padrao no commit | Acao |
|------------------|------|
| `[frontend]` | Deploy do frontend |
| `[backend]` | Deploy do backend |
| `[deploy]` | Deploy de ambos |

---

## Changelog recente

### Categorias APPLE / ANDROID com subcategorias (2026-02-06)

Implementacao de agrupamento de categorias no filtro de produtos. APPLE e ANDROID funcionam como categorias pai, com subcategorias expansiveis e selecao em grupo.

**Mapeamento:**
```
APPLE   -> ACSS, IPD, IPH, MCB, MNTR, PODS, RLG
ANDROID -> MI, NOTE, PAD, POCO, RDM, REAL
```

Categorias que nao pertencem a nenhum grupo aparecem em "Outros".

**Alteracoes:**

- **Novo arquivo `frontend/src/data/categoryGroups.js`** — Constante de mapeamento APPLE/ANDROID com funcoes auxiliares `groupCategories()` e `getSubcategories()`
- **`MultiSelectFilter.jsx`** — Checkbox no titulo do grupo para selecionar/desmarcar todas as subcategorias de uma vez; icone chevron para expandir/colapsar; contador de selecao por grupo (ex: `3/7`); subcategorias com indentacao visual
- **`Products.jsx`** — Filtro de categorias agora usa formato agrupado; funcao `getCategoryIcon()` expandida com icones para categorias Android (MI, NOTE, PAD, POCO, RDM, REAL) e icones corrigidos para MNTR (Monitor) e RLG (Watch); handler `onCategorySelect` aceita arrays
- **`SearchAutocomplete.jsx`** — Badges de atalho trocados de "iPhone / Macbook / iPad / Acessorios" para "Apple" e "Android"; cada badge ativa todas as categorias do grupo ao clicar

**Correcoes:**
- Bug do icone de Watch/Relogio que usava icone de Laptop — corrigido para usar icone Watch

---

### Redesign Visual — Glass Morphism + Geist Font (2026-02-05)

Migracao completa do design visual do frontend.

**Design System:**
- Migracao de cores `gray-*` para `neutral-*` em todos os componentes
- Fonte Geist adicionada via Google Fonts CDN
- Glass morphism via CSS: `.glass-panel`, `.glass-card`, `.glass-card-dark`, `.glass-input`
- Animacoes: fadeInUp, float, pulse-glow, shimmer, blink
- Tailwind config expandido com tokens neutral e novas animacoes

**Novos componentes:**
- `glass-card.jsx` — Card com efeito glass para uso global
- `status-pill.jsx` — Pill de status estilizada
- `background-decoration.jsx` — Decoracao de fundo com variantes
- `BannerCarousel.jsx` — Carrossel de banners para parceiros
- `DatePickerDropdown.jsx` — Seletor de data com dropdown

**Componentes atualizados:**
- `button.jsx` — Novas variantes: accent, lime, pill sizes
- `badge.jsx` — Novas variantes: lime, limeSubtle, status
- `Navbar.jsx` — Redesenhada com glass-panel e container pill
- Todas as ~30 paginas e componentes atualizados para o novo design

---

### Codigo de Usuario e Sync de Planilha (2026-02-05)

- Geracao automatica de `codeId` para cada usuario (novos e existentes)
- Pesquisa de usuarios por codigo no painel admin com exibicao de detalhes
- Otimizacao do tempo de atualizacao apos alteracoes na planilha Google Sheets
- Integracao do codeId na mensagem de WhatsApp para fornecedores

---

### Outros (recentes)

- Suporte a upload de GIF nos banners
- Correcao do link de WhatsApp no mobile
- Correcao de cadastro com email em letras maiusculas (forcado para minusculas)
- Correcao na exibicao do dropdown de selecao de pais
- Adicionado plano de teste

---

## Estrutura do projeto

```
buscadorpxtversao2/
  ├── backend/               # API NestJS
  │   ├── src/
  │   │   ├── auth/          # Autenticacao JWT
  │   │   ├── products/      # Produtos
  │   │   ├── suppliers/     # Fornecedores
  │   │   ├── sheets/        # Integracao Google Sheets
  │   │   ├── cache/         # Sistema de cache
  │   │   ├── notifications/ # Email, WhatsApp, WebSocket
  │   │   ├── presence/      # Sessoes e analytics
  │   │   ├── subscriptions/ # Assinaturas
  │   │   ├── upload/        # Upload S3/R2
  │   │   └── ...            # ~28 modulos total
  │   ├── migrations/        # 30+ SQL migrations
  │   └── Dockerfile
  ├── frontend/              # SPA React
  │   ├── src/
  │   │   ├── components/    # Componentes (UI, modais, cards)
  │   │   ├── pages/         # Paginas por rota
  │   │   ├── hooks/         # Custom hooks
  │   │   ├── contexts/      # Auth, Theme
  │   │   ├── services/      # API client (Axios)
  │   │   └── data/          # Dados estaticos
  │   └── Dockerfile
  ├── docker-compose.yml
  └── README.md
```
