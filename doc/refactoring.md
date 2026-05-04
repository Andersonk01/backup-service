# Plano: de mock a serviço funcional

Este documento descreve o **estado atual** do `backup-service`, o **alvo** funcional (orquestração de backups → armazenamento externo, ex.: Google Drive) e as **tasks** ainda pendentes.

---

## Estado atual (implementado)

| Área | Situação |
|------|----------|
| **UI** | Next.js 16, dashboard com sidebar, páginas `/`, `/databases`, `/jobs`, `/history`, `/storage`, `/settings`; tema escuro e componentes shadcn. |
| **Dados na UI** | `lib/mock-data.ts` + `lib/types.ts`; nenhuma persistência real. |
| **Ações na UI** | “Backup”, “testar conexão”, “sincronizar Drive”, etc. são **simulações** (`setTimeout` + toasts), sem backend. |
| **`app/api`** | Não existe camada HTTP da aplicação para CRUD ou comandos. |
| **`layout/`** | Cópia de referência do v0; excluída de `tsconfig` e `eslint` — candidata a remoção ou arquivamento quando não for mais necessária. |
| **Infra dev** | Build e lint OK; ESLint mantido na linha **9.x** por compatibilidade com `eslint-config-next` (evitar ESLint 10 até o ecossistema alinhar). |

---

## Alvo funcional (resumo)

1. Registrar bancos e jobs (cron / frequência).
2. **Worker** executa ferramentas locais (**`pg_dump`**, futuramente mysqldump, mongodump, etc.).
3. Envia artefato para **Google Drive** (Drive API ou **`rclone`**) usando segredos em env/secret manager.
4. Persistir **histórico de execuções**, logs e metadados (tamanho, duração, status).
5. **Retenção** e limpeza de backups antigos (local ou no Drive).
6. Agendamento fora da UI em loop ocupando CPU: cron do SO, PM2, ou fila + worker dedicado.

---

## Épicos e ordem sugerida

1. **Persistência + API** — base para todo o resto.
2. **Worker mínimo (Postgres + arquivo local)** — prova que o dump funciona antes do Drive.
3. **Upload (rclone ou Drive API)** — entrega ao destino definido pela configuração.
4. **Agendamento + integração UI** — jobs reais disparando o worker ou fila.
5. **Hardening** — segurança, observabilidade, Windows/PATH, retenção.

---

## Tasks pendentes (checklist)

### Epic 1 — Modelo de dados e API

- [ ] **1.1** Escolher e configurar BD da aplicação (ex.: Postgres local / SQLite para dev); adicionar ORM migrations (Prisma recomendado se o time já usar).
- [ ] **1.2** Modelar entidades mínimas: `DatabaseCredential` (nome, tipo, secreto refs), `BackupJob` (cron, `databaseId`, ativo), `BackupRun` (status, iniciado/em, erro, paths, bytes), config global (timezone, defaults de retenção).
- [ ] **1.3** Implementar **`app/api`** (REST ou Route Handlers): CRUD de bancos e jobs; `POST` para disparo manual de backup; listagem paginada de `BackupRun`; leitura de config não sensível.
- [ ] **1.4** Nunca gravar URLs de conexão em texto plano sem **criptografia em repouso** ou uso de vault; documentar formato de secreto esperado (`DATABASE_URL` por job ou referência a secret name).
- [ ] **1.5** Substituir gradualmente mocks na UI por **fetch** às APIs (SSR ou client com React Query/`useEffect`, coerente com o padrão do projeto).

### Epic 2 — Worker e execução do dump

- [ ] **2.1** Criar pacote/script **`backup-worker`** (ou `scripts/backup.ts`) que receba argumentos/env: `JOB_ID` / `DATABASE_ID`, path de saída, formato (`--format=custom`/plain sql).
- [ ] **2.2** Invocar **`pg_dump`** via `child_process`; documentar **`PG_DUMP_PATH`** ou PATH no Windows vs Linux no `.env.example`.
- [ ] **2.3** Atualizar estado do `BackupRun` no BD (running → success/failed) e anexar **exit code** + stdout/stderr truncados em log.
- [ ] **2.4** (Opcional fase 2) Suporte **MySQL** / **MongoDB** com comandos equivalentes e mesma superfície de run.

### Epic 3 — Google Drive / armazenamento remoto

- [ ] **3.1** Definir estratégia: **rclone** (menos código) ou **Drive API + `googleapis`** (OAuth ou conta de serviço).
- [ ] **3.2** Implementar um módulo `uploadArtifact(localPath)` lendo config de env (`RCLONE_REMOTE`, pasta destino ou credenciais JSON de serviço).
- [ ] **3.3** Conectar fluxo worker: pós-dump bem-sucedido → upload → registrar **ID remoto**/path na `BackupRun` ou tabela `BackupArtifact`.

### Epic 4 — Agendamento

- [ ] **4.1** Persistir expressão cron / próxima execução nos jobs no BD.
- [ ] **4.2** Escolher mecanismo: **lista de jobs avaliados por worker a cada minuto**, **cron do SO chamando CLI**, ou **PM2 `cron_restart` / ecosystem segundo processo**.
- [ ] **4.3** (Opcional robusto) Fila (**BullMQ** + Redis ou similar): API enfileira; worker consome; retries e backoff.

### Epic 5 — Retenção, segurança e operação

- [ ] **5.1** Política de retenção: apagar runs antigas e opcionalmente arquivos remotos conforme dias/retenção por job.
- [ ] **5.2** **`DATABASE_URL`/tokens** apenas em `.env` / provedor de secrets; atualizar README com envs obrigatórias.
- [ ] **5.3** Janelas de backup em horários de menor carga; documentar impacto em bases muito grandes (snapshot gerenciado vs dump pela rede).

### Repo e higiene

- [ ] **R.1** Remover ou mover `layout/` para fora da árvore de build (ou documentar uso exclusivo como “design reference”).
- [ ] **R.2** Rotas faltantes no menu (**`/activity`**, **`/security`**) ou remover links no `app-sidebar` até existirem páginas — evitar 404 silenciosa em produção.

---

## Referências rápidas (env sugeridas)

Variáveis a documentar quando o backend existir (nomes ilustrativos):

- `DATABASE_URL` — Postgres **alvo** do dump **ou** string do BD **da própria aplicação** (não misturar sem nomenclatura clara, ex.: `APP_DATABASE_URL`).
- `PG_DUMP_PATH` — caminho absoluto no Windows/Linux.
- `RCLONE_REMOTE` / credenciais Google conforme estratégia do Epic 3.

---

## Changelog deste doc

| Data       | Mudança |
|------------|---------|
| 2026-05-04 | Reestruturado: estado atual, épicos, checklist de tasks, referência de env, item de repo/higiene. |
