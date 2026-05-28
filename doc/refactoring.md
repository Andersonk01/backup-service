# Plano: de mock a serviço funcional

Este documento descreve o **estado atual** do `backup-service`, o **alvo** funcional (orquestração de backups → armazenamento externo, ex.: Google Drive) e as **tasks** ainda pendentes.

---

## Estado atual (implementado)

| Área | Situação |
|------|----------|
| **UI** | Next.js 16, dashboard com sidebar, páginas `/`, `/databases`, `/jobs`, `/history`, `/storage`, `/settings`, `/storage/explorer`; tema escuro e componentes shadcn. |
| **Dados na UI** | Conexão real via fetch às APIs REST; dashboard com dados do backend; históricos, jobs, databases, settings reais. |
| **Ações na UI** | Backup manual, testar conexão, criar/deletar databases e jobs, upload Google Drive — tudo real via API. |
| **`app/api`** | REST completo: CRUD databases, jobs, runs, stats, settings, storage (remotes, OAuth, upload, files). |
| **Worker** | `scripts/backup-worker.ts` — loop com polling a cada 30s, executa `pg_dump`, atualiza `BackupRun`, faz upload opcional ao Google Drive via rclone. |
| **Storage** | Rclone wrapper (`lib/rclone.ts`) com spawn do binário embutido `rclone.js`, leitura/escrita direta de `rclone.conf` (INI), comandos: config, lsjson, lsd, about, mkdir, copy, cat, deletefile, purge, moveto. |
| **Google OAuth** | `lib/google-oauth.ts` — fluxo via `rclone authorize "drive" --auth-no-open-browser`, extrai URL de `127.0.0.1:53682/auth?state=...` do stderr, aguarda processo finalizar com token no stdout. |
| **File Manager** | Página `/storage/explorer` com breadcrumbs, listagem de arquivos/pastas, upload, nova pasta, renomear, deletar, download. Sidebar com link "Arquivos". |
| **Settings** | `lib/settings.ts` — leitura/escrita de `data/settings.json` (defaultRemote, storageBackupPath). |
| **Infra dev** | Build e lint OK; Docker Compose com PostgreSQL 16. |
| **`layout/`** | Cópia de referência do v0; excluída de `tsconfig` e `eslint` — candidata a remoção ou arquivamento quando não for mais necessária. |

---

## Alvo funcional (resumo)

1. Registrar bancos e jobs (cron / frequência).
2. **Worker** executa ferramentas locais (**`pg_dump`**, futuramente mysqldump, mongodump, etc.).
3. Envia artefato para **Google Drive** via **rclone** (OAuth integrado, sem Google Cloud Console para o usuário final).
4. Persistir **histórico de execuções**, logs e metadados (tamanho, duração, status).
5. **Retenção** e limpeza de backups antigos (local ou no Drive).
6. Agendamento fora da UI em loop ocupando CPU: cron do SO, PM2, ou fila + worker dedicado.

---

## Épicos e ordem sugerida

1. ~~**Persistência + API** — base para todo o resto.~~ ✅
2. ~~**Worker mínimo (Postgres + arquivo local)** — prova que o dump funciona antes do Drive.~~ ✅
3. ~~**Upload (rclone ou Drive API)** — entrega ao destino definido pela configuração.~~ ✅
4. **Agendamento + integração UI** — jobs reais disparando o worker ou fila.
5. **Hardening** — segurança, observabilidade, Windows/PATH, retenção.

---

## Tasks pendentes (checklist)

### Epic 1 — Modelo de dados e API

- [x] **1.1** Escolher e configurar BD da aplicação (SQLite via Prisma); adicionar ORM migrations (Prisma).
- [x] **1.2** Modelar entidades: `DatabaseCredential`, `BackupJob`, `BackupRun`.
- [x] **1.3** Implementar **`app/api`** (REST): CRUD de bancos e jobs; `POST` disparo manual; listagem de `BackupRun`; leitura/config.
- [x] **1.4** Evitar URLs em texto plano (documentado; segredos via env).
- [x] **1.5** UI conectada às APIs reais (dashboard, bancos, jobs, histórico, settings).

### Epic 2 — Worker e execução do dump

- [x] **2.1** Script **`scripts/backup-worker.ts`** com polling.
- [x] **2.2** Invocar **`pg_dump`** via `child_process`; `PG_DUMP_PATH` do env ou PATH.
- [x] **2.3** Atualizar `BackupRun` (running → success/failed) com exit code e logs.
- [ ] **2.4** (Opcional fase 2) Suporte **MySQL** / **MongoDB**.

### Epic 3 — Google Drive / armazenamento remoto

- [x] **3.1** Estratégia: **rclone** com wrapper em `lib/rclone.ts`.
- [x] **3.2** Módulo `uploadFileToRemote()` + `listFiles()`, `downloadFile()`, `deleteFile()`, `createDir()`, `renameItem()`.
- [x] **3.3** Conexão worker: pós-dump bem-sucedido → upload via rclone (se `STORAGE_UPLOAD_ENABLED=true`).
- [x] **3.4** OAuth integrado via `rclone authorize` — sem necessidade de Google Cloud Console para o usuário final.
- [x] **3.5** File manager na UI (`/storage/explorer`) com upload, download, rename, delete, nova pasta.

### Epic 4 — Agendamento

- [ ] **4.1** Persistir expressão cron / próxima execução nos jobs no BD.
- [x] **4.2** Mecanismo atual: **worker com polling a cada 30s** avaliando jobs ativos.
- [ ] **4.3** (Opcional robusto) Fila (**BullMQ** + Redis ou similar): API enfileira; worker consome; retries e backoff.

### Epic 5 — Retenção, segurança e operação

- [ ] **5.1** Política de retenção: apagar runs antigas e opcionalmente arquivos remotos conforme dias/retenção por job.
- [ ] **5.2** **`DATABASE_URL`/tokens** apenas em `.env` / provedor de secrets; README com envs obrigatórias.
- [ ] **5.3** Janelas de backup em horários de menor carga; documentar impacto em bases muito grandes.

### Repo e higiene

- [ ] **R.1** Remover ou mover `layout/` para fora da árvore de build (ou documentar uso exclusivo como "design reference").
- [ ] **R.2** Rotas faltantes no menu (**`/activity`**, **`/security`**) ou remover links no `app-sidebar` até existirem páginas — evitar 404 silenciosa.
- [x] **R.3** Adicionar item "Arquivos" na sidebar (mobile e desktop).

### Segredos e segurança

- [x] **S.1** `data/rclone.conf` adicionado ao `.gitignore` — evitar commit de tokens OAuth reais.
- [ ] **S.2** Validar que nenhum token/secret vaza em logs do worker ou respostas de API.

---

## Peculiaridades técnicas relevantes

- **`rclone.js` v0.6.6**: bundler CJS, sem tipos TypeScript. O binário ELF 64-bit estático está em `node_modules/rclone.js/bin/rclone`. Usar `path.resolve(process.cwd(), ...)` em vez de `require.resolve()` (Turbopack devolve path virtual `[project]/...`).
- **`runRcloneCommand()`**: usa `spawn()` diretamente, não a Promise API do rclone.js (que rejeita qualquer saída em stderr).
- **INI config**: lê e escreve `rclone.conf` diretamente com parser INI caseiro, sem usar `rclone config create` (que é interativo para Google Drive).
- **`rclone authorize`**: inicia servidor HTTP em `127.0.0.1:53682`, redireciona para Google OAuth. Flag `--auth-no-open-browser` (não `--no-open-browser`).
- **Google Drive backend**: não suporta `rclone config userinfo` — usar `lsd` ou `about` para testar conexão.
- **Settings**: persistidos em `data/settings.json` via `lib/settings.ts` (não no banco Prisma).

---

## Referências rápidas (env sugeridas)

Variáveis a documentar:

- `DATABASE_URL` — string de conexão do BD da aplicação.
- `PG_DUMP_PATH` — caminho absoluto no Windows/Linux (fallback para PATH).
- `STORAGE_UPLOAD_ENABLED` — `"true"` para ativar upload pós-dump.
- `STORAGE_UPLOAD_REMOTE` — nome do remote rclone destino.
- `STORAGE_UPLOAD_PATH` — pasta no remote (ex.: `Backups`).
- `RCLONE_CONFIG_PATH` — caminho customizado do `rclone.conf`.

---

## Changelog deste doc

| Data       | Mudança |
|------------|---------|
| 2026-05-04 | Reestruturado: estado atual, épicos, checklist de tasks, referência de env, item de repo/higiene. |
| 2026-05-10 | Implementado Prisma ORM, schema e migrations |
| 2026-05-10 | Criadas API Routes REST (CRUD databases, jobs, runs, stats) |
| 2026-05-10 | Conectada UI ao backend real (dashboard, bancos, histórico) |
| 2026-05-10 | Criado worker de backup com pg_dump (scripts/backup-worker.ts) |
| 2026-05-10 | Adicionado docker-compose.yml para PostgreSQL 16 |
| 2026-05-10 | Adicionado cleanup de arquivos órfãos e auto-refresh do dashboard |
| 2026-05-28 | Implementado rclone wrapper (lib/rclone.ts), OAuth via rclone authorize, storage API e AddRemoteDialog |
| 2026-05-28 | Implementado file manager (explorer page, API de arquivos, sidebar "Arquivos") |
| 2026-05-28 | Conectada página de Jobs e Settings às APIs reais |
| 2026-05-28 | Adicionado data/settings.json ao .gitignore; seção de segredos e peculiaridades técnicas |
