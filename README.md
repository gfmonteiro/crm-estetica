# Studio CRM — MVP

CRM para clínicas de estética / lash design. **Multi-tenant**: você (dono da plataforma) tem uma área Master onde cadastra os negócios que usam o sistema (cada Lash Designer, clínica, Nail Designer...), e cada um deles tem seus próprios dados, totalmente isolados dos demais.

## Como rodar

```bash
npm install
npm run seed     # cria usuário master + 1 organização demo com dados de exemplo
npm run dev
```

Acesse `http://localhost:3000`. Dois logins de exemplo:

- **Master** (você, gerencia os negócios): `master@studio.com` / `master1234`
- **Organização demo** (um cliente seu, ex.: Lash Designer): `demo@studio.com` / `demo1234`

O login da organização demo já vem preenchido na tela.

## Área Master

Em `/master`, você:
- Vê todas as organizações cadastradas (negócios que usam o sistema)
- Cria uma nova organização — no mesmo formulário já define o e-mail/senha que o dono daquele negócio vai usar para logar
- Suspende/reativa o acesso de uma organização (login fica bloqueado enquanto suspensa)
- Adiciona mais usuários (ex.: uma funcionária) dentro de uma organização já existente
- Remove uma organização (isso apaga **todos** os dados dela — clientes, agenda, financeiro, tudo)

Cada organização só enxerga os próprios dados. Isso é garantido no nível dos repositórios (`src/lib/db/repositories/*`), não só na tela — toda consulta exige o `organizationId` da sessão logada.

## O que tem hoje

- **Autenticação multi-tenant** — sessão em cookie httpOnly (JWT) carregando `role` (`master` | `admin` | `profissional`) e `organizationId`. Rotas do tenant exigem organização; rotas master exigem `role: master`.
- **Dashboard** — clientes ativos/novos, atendimentos do dia, faturamento do mês, ticket médio, aniversariantes, taxa de cancelamento, agenda do dia e próximos agendamentos.
- **Clientes** — cadastro completo (dados, endereço, origem, tags), busca, perfil 360° com histórico de atendimentos e financeiro, exclusão em soft-delete (histórico nunca é apagado).
- **Procedimentos** — catálogo com valor, tempo médio, comissão, descrição e materiais.
- **Agenda** — visualização por dia com navegação, criação de agendamento, atualização de status.
- **Financeiro** — lançamentos de receita/despesa, categorias, método de pagamento, fluxo de caixa.
- **WhatsApp (automação de mensagens)** — regras de "enviar X dias após o atendimento", com coringas `{{cliente}}`, `{{procedimento}}`, `{{profissional}}`, `{{dias}}`, preview ao vivo, histórico de disparos e botão de execução manual.
- **Pipeline de vendas (Kanban)** — leads em 8 etapas, arrastar e soltar, busca, atividades automáticas, conversão em cliente com um clique.

## WhatsApp — como colocar pra valer

1. Crie um app no [Meta for Developers](https://developers.facebook.com/) e ative o produto WhatsApp. Isso te dá um **Phone Number ID** (número de teste grátis) e um **Access Token** temporário.
2. Na tela `/whatsapp` do CRM, clique em **Conexão** e cole os dois valores. Eles ficam salvos em `src/lib/data/orgs/<organizationId>/whatsapp_settings.json`.
3. Crie suas regras (nome, dias após o atendimento, mensagem com coringas).
4. Clique em **Executar disparos de hoje** para testar manualmente.

**Antes de ir pra produção de verdade, dois pontos importantes:**

- **Token temporário vs. permanente** — o token do passo 1 expira em 24h. Para produção, gere um token de sistema permanente (System User) no Meta Business Manager.
- **Texto livre vs. template** — a Meta só entrega mensagens proativas (como esse lembrete automático) se forem um **template pré-aprovado**, não texto livre. Cadastre o template no Business Manager, espere aprovação, e troque o corpo da requisição em `src/lib/whatsapp.ts` (`sendWhatsAppMessage`) de `type: "text"` para `type: "template"` — o comentário no próprio arquivo já mostra o formato exato do payload.
- **Execução automática diária** — hoje o disparo só roda quando você clica no botão. Para rodar sozinho todo dia, chame `POST /api/whatsapp/run` por um cron (ex.: [Vercel Cron](https://vercel.com/docs/cron-jobs), GitHub Actions agendado, ou um `cron` no seu servidor apontando pro endpoint com `curl`).

## Próximos módulos (nesta ordem sugerida)

1. Marketing (campanhas segmentadas, fidelidade, cupons).
2. Estoque.
3. Relatórios avançados (LTV, CAC, ROI) e IA (resumo de histórico, previsão de retorno).
4. Franquias/múltiplas unidades dentro de uma mesma organização.

## Sobre a persistência de dados

Para o MVP rodar localmente sem precisar configurar Postgres, os dados ficam em arquivos JSON. Dados globais da plataforma (organizações, usuários) ficam em `src/lib/data/`; os dados de cada organização ficam isolados em `src/lib/data/orgs/<organizationId>/`. Tudo é acessado através de repositórios em `src/lib/db/repositories/`, que sempre recebem o `organizationId` como primeiro parâmetro.

Isso foi uma decisão pragmática: o sandbox onde este projeto foi gerado não tinha acesso ao domínio de download do engine do Prisma. **Para produção, troque por Postgres com Row-Level Security (RLS) por `organization_id`:**

1. `npm install prisma @prisma/client`
2. Crie `prisma/schema.prisma` usando como referência o diagrama `diagrama-er-banco-dados.mermaid`, adicionando `organizationId` a cada tabela de tenant.
3. Reimplemente as funções de `src/lib/db/repositories/*.ts` usando `prisma.client.<model>.findMany({ where: { organizationId } })` no lugar de `readOrgCollection`/`writeOrgCollection`.

Como a aplicação já segue o repository pattern com `organizationId` explícito em cada chamada, **nada nas páginas, APIs ou componentes precisa mudar** — só a implementação interna dos repositórios.

O documento de arquitetura completo (`docs/01-arquitetura-crm-estetica.md`) e os diagramas Mermaid (`docs/*.mermaid`) continuam válidos como mapa geral do projeto.

## Estrutura do projeto

```
src/
  app/
    master/          área do dono da plataforma (gestão de organizações)
    (app)/          páginas autenticadas do tenant (dashboard, clientes, agenda, pipeline, procedimentos, financeiro, whatsapp)
    api/
      master/         rotas exclusivas do dono da plataforma
      ...              demais rotas REST, isoladas por organização
    login/
  components/        Sidebar, MasterTopbar, ThemeToggle, Badge, KpiCard
  lib/
    db/
      store.ts         persistência em arquivo JSON (com/sem isolamento por org)
      repositories/     um arquivo por entidade
    auth.ts             hash de senha, sessão JWT
    session.ts           helpers requireOrgSession / requireMasterSession
    dashboard.ts          agregação de KPIs
    automation-engine.ts   motor de disparo do WhatsApp
    whatsapp.ts             integração com a Cloud API da Meta
    constants.ts             tags, status, categorias, etapas do pipeline
    format.ts                 formatação de moeda/data
  types/               tipos das entidades
  proxy.ts              middleware de proteção de rotas
scripts/
  seed.ts                dados de exemplo (master + organização demo)
docs/
  01-arquitetura-crm-estetica.md    documento de arquitetura completo
  *.mermaid                          diagramas (arquitetura, ER, navegação)
```
