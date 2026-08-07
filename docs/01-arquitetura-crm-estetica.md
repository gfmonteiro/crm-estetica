# Arquitetura — CRM para Clínicas de Estética / Lash Design

## 1. Visão geral

Um SaaS multi-tenant para profissionais e clínicas de estética (lash design, sobrancelhas, estética facial/corporal), cobrindo: cadastro de clientes, agenda, financeiro, WhatsApp, marketing, pipeline de vendas, estoque, equipe, relatórios e IA.

Este documento define a arquitetura antes do código, conforme solicitado. É organizado em: stack, arquitetura de software, multi-tenancy, modelo de dados (resumo — diagrama ER em arquivo separado), fluxo de navegação (diagrama separado), API, segurança, performance e roadmap por etapas.

---

## 2. Stack tecnológica (decisão e justificativa)

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend web | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | SSR/SSG para performance, roteamento por módulo, DX moderna |
| Estado/dados no client | TanStack Query + Zustand | cache de servidor separado de estado de UI |
| Mobile/responsivo | PWA (mesmo Next.js) | evita manter app nativo separado no MVP |
| Backend | NestJS (Node.js + TypeScript) | arquitetura modular nativa (módulos, DI), ótimo para Clean Architecture |
| Banco relacional | PostgreSQL 16 | dados relacionais fortes (cliente → histórico → financeiro), suporte a JSONB para campos flexíveis (ex.: respostas de anamnese) |
| ORM | Prisma | migrations versionadas, types gerados, boa DX |
| Cache/filas | Redis + BullMQ | filas para disparos de WhatsApp/lembretes, cache de dashboard |
| Armazenamento de arquivos | Amazon S3 (fotos, documentos, antes/depois) | durável, barato, URLs assinadas |
| Autenticação | JWT (access + refresh) + OAuth (Google, para agenda) + 2FA (TOTP) | padrão de mercado, permite SSO futuro |
| Realtime | WebSocket (Socket.io) via Redis adapter | notificações, status de mensagens WhatsApp, agenda ao vivo |
| WhatsApp | WhatsApp Business API (Meta Cloud API) via provedor (ex.: Twilio, Z-API ou 360dialog) | mensageria oficial, evita bloqueio de número |
| Filas de envio em massa | BullMQ com rate limiting | respeitar limites de envio do WhatsApp |
| Busca | PostgreSQL full-text search (fase 1) → Meilisearch/Elasticsearch (fase 2 se necessário) | evita complexidade prematura |
| IA | API da Anthropic (Claude) para resumos, sugestões de mensagem, previsão de retorno (com modelo de scoring simples) | já documentado, fácil de integrar via API |
| Infra | Docker + Kubernetes (ou Railway/Render no MVP) | escalar de 1 clínica a multiempresa sem reescrever |
| Observabilidade | Sentry (erros) + OpenTelemetry + Grafana/Loki (logs/métricas) | rastreabilidade em produção |
| CI/CD | GitHub Actions | testes, lint, deploy automatizado |

---

## 3. Arquitetura de software (Clean Architecture)

Cada módulo do backend segue 4 camadas, isoladas por interfaces (SOLID — Dependency Inversion):

```
apps/api/src/modules/<modulo>/
├── domain/           → Entidades e regras de negócio puras (sem dependência de framework)
│   ├── entities/
│   ├── value-objects/
│   └── repositories/ (interfaces)
├── application/       → Casos de uso (use cases), orquestram domínio
│   ├── use-cases/
│   └── dtos/
├── infrastructure/    → Implementações concretas (Prisma, S3, WhatsApp API)
│   ├── repositories/
│   ├── providers/
│   └── mappers/
└── presentation/       → Controllers REST, validação de entrada, guards
    ├── controllers/
    └── schemas/ (zod/class-validator)
```

Regra de dependência: `presentation → application → domain ← infrastructure`. O domínio nunca conhece Prisma, S3 ou HTTP.

Padrões aplicados:
- **Repository Pattern** — abstrai persistência (troca Postgres por outro banco sem tocar domínio).
- **Strategy Pattern** — canais de notificação (WhatsApp, e-mail, SMS) implementam a mesma interface `NotificationChannel`.
- **Observer/Event-driven** — eventos de domínio (`AppointmentCreated`, `ClientBirthday`, `PaymentReceived`) disparam side-effects (lembretes, comissão, atualização de dashboard) via event bus interno (NestJS `EventEmitter2` no MVP; migrar para filas dedicadas se o volume crescer).
- **CQRS leve** — separar leitura de dashboards/relatórios (queries otimizadas, possivelmente views materializadas) da escrita transacional.
- **Factory Pattern** — criação de lembretes/automação a partir de templates configuráveis por tenant.

### 3.1 Diagrama de arquitetura em alto nível

Veja o arquivo `diagrama-arquitetura.mermaid` (anexo) para o diagrama visual completo. Resumo textual:

```
[Next.js Web/PWA] --HTTPS--> [API Gateway / NestJS]
                                     |
      +------------------------------+------------------------------+
      |                              |                               |
[Módulos de domínio]        [Fila BullMQ + Redis]           [WebSocket Gateway]
(Clientes, Agenda,           - lembretes                     - notificações realtime
 Financeiro, Pipeline,       - disparos WhatsApp              - status de agenda
 Estoque, Marketing...)      - relatórios pesados
      |                              |
[Prisma ORM] --------------> [PostgreSQL] (multi-tenant)
      |
[S3 (fotos/docs)]   [WhatsApp Cloud API]   [Claude API (IA)]   [Google Calendar API]
```

---

## 4. Multi-tenancy (SaaS: 1 profissional → franquias)

Estratégia recomendada: **schema compartilhado com `tenant_id` em todas as tabelas** (shared database, shared schema), reforçado por Row-Level Security (RLS) no PostgreSQL.

Por quê essa escolha e não schema-per-tenant:
- Custo de manutenção menor (uma única migration roda para todos os tenants).
- RLS do Postgres garante isolamento de dados no nível do banco, não só na aplicação — reduz risco de vazamento entre clínicas.
- Fácil escalar horizontalmente com particionamento por `tenant_id` se necessário no futuro (milhares de clínicas).

Para franquias/redes com múltiplas unidades: modelo `organization → units (unidades/filiais) → users`, onde `organization_id` é o tenant real e `unit_id` segmenta agenda/estoque/financeiro por filial, mas permite relatórios consolidados na organização.

Cada request autenticado carrega `tenant_id` no JWT; um middleware injeta esse contexto em toda query (via Prisma middleware + `SET app.current_tenant` para a policy de RLS).

---

## 5. Modelo de dados (resumo)

O diagrama ER completo está no arquivo `diagrama-er-banco-dados.mermaid`. Entidades principais:

- **organizations, units, users, roles, permissions** — multi-tenant e RBAC
- **clients, client_tags, client_attachments** — cadastro e tags (VIP, gestante, etc.)
- **procedures** — catálogo de serviços (valor, tempo, comissão, materiais)
- **appointments, appointment_status_history, waitlist** — agenda
- **service_history, photos (before/after), documents, signatures** — histórico imutável
- **financial_transactions, financial_categories, commissions, installments** — financeiro
- **products, stock_movements, suppliers** — estoque
- **pipeline_stages, leads, lead_activities** — funil de vendas (Kanban)
- **campaigns, campaign_targets, coupons, loyalty_points, referrals** — marketing e fidelização
- **whatsapp_messages, message_templates, automation_rules** — comunicação
- **audit_logs** — trilha de auditoria (LGPD)

Princípio de design: **histórico nunca é apagado** (soft-delete via `deleted_at`, nunca `DELETE` físico em tabelas de histórico/financeiro), conforme especificado no prompt original.

---

## 6. Fluxo de navegação

Diagrama completo em `fluxo-navegacao.mermaid`. Estrutura de rotas (sitemap):

```
/login, /2fa
/dashboard
/clientes            /clientes/:id (perfil 360°: histórico, fotos, financeiro, docs)
/agenda               (dia/semana/mês/timeline)
/pipeline             (kanban de leads)
/financeiro           /financeiro/fluxo-caixa /financeiro/contas
/estoque
/marketing            /marketing/campanhas /marketing/fidelidade
/whatsapp             (central de conversas + automações)
/relatorios
/equipe
/configuracoes        /configuracoes/empresa /configuracoes/integracoes /configuracoes/usuarios
```

---

## 7. API

REST versionada (`/api/v1/...`), documentada com OpenAPI/Swagger, gerada automaticamente a partir dos DTOs do NestJS. Convenções:
- Recursos aninhados por tenant implícito (via JWT, não na URL).
- Paginação cursor-based em listagens grandes (clientes, mensagens).
- Rate limiting por tenant nas rotas de disparo em massa.
- Webhooks de entrada para status de mensagens do WhatsApp e eventos do Google Calendar.

---

## 8. Segurança e LGPD

- Criptografia em trânsito (TLS) e em repouso (dados sensíveis como CPF criptografados a nível de coluna).
- RBAC granular (por módulo e ação: ver, criar, editar, excluir, exportar).
- 2FA obrigatório para perfis admin.
- Logs de auditoria em toda alteração de dado sensível (quem, quando, o quê, valor anterior/novo).
- Consentimento explícito e exportação/exclusão de dados do titular (direitos LGPD) com fluxo dedicado.
- Backups automáticos diários + point-in-time recovery.

---

## 9. Performance e escalabilidade

- Cache de dashboard (Redis, TTL curto) para evitar recalcular métricas a cada request.
- Views materializadas para relatórios pesados (LTV, CAC, ROI), atualizadas via job agendado.
- Lazy loading e paginação em todas as listagens.
- Índices compostos por `(tenant_id, campo_de_busca)` em todas as tabelas grandes.
- CDN para assets estáticos e fotos (via S3 + CloudFront).

---

## 10. Diferenciais propostos (além do escopo original)

Baseado em práticas de CRMs líderes do setor de beleza (agendamento online, lembretes automáticos, gestão de comissão), alguns diferenciais adicionais recomendados:

1. **Score de risco de abandono por cliente** (IA), calculado a partir de intervalo médio entre visitas + comparecimento a lembretes.
2. **Sugestão automática de próximo agendamento** ao final de um atendimento, baseado no tempo médio de manutenção do procedimento.
3. **Assinatura digital embutida** para termos de consentimento (sem depender de serviço externo pago no MVP).
4. **Modo "dia da profissional"**: tela simplificada para a esteticista ver só a própria agenda do dia, sem acesso a financeiro/configurações.
5. **Central de conversas unificada** (WhatsApp + Instagram Direct, se disponível na API) num só inbox.
6. **Relatório de ocupação de agenda** (% de horários preenchidos por profissional/dia), métrica pouco explorada nos concorrentes.

---

## 11. Roadmap por etapas

**Fase 0 — Fundação (infra e base)**
Setup do monorepo, autenticação multi-tenant, RBAC, CI/CD, estrutura Clean Architecture, deploy inicial.

**Fase 1 — MVP operacional**
Cadastro de clientes, procedimentos, agenda (CRUD + visualizações), histórico do cliente, dashboard básico.

**Fase 2 — Comunicação e automação**
Integração WhatsApp (confirmações, lembretes 24h/2h, pós-atendimento), fila de disparos, templates.

**Fase 3 — Financeiro e estoque**
Fluxo de caixa, contas a pagar/receber, comissões, controle de estoque com alertas.

**Fase 4 — Vendas e marketing**
Pipeline Kanban, campanhas segmentadas, cupons, programa de fidelidade, indique-e-ganhe.

**Fase 5 — Relatórios avançados e IA**
Relatórios completos (LTV, CAC, ROI, no-show), resumo automático de histórico, previsão de retorno, sugestão de mensagens.

**Fase 6 — Multiempresa e escala**
Suporte a franquias/múltiplas unidades, relatórios consolidados, otimizações de performance para grande volume, app mobile nativo (se necessário).

---

## 12. Próximo passo

Este é o plano de arquitetura completo. O próximo passo natural é começar a implementação módulo a módulo (Fase 0 → Fase 1), já que construir o sistema inteiro de uma vez não é viável em uma única entrega. Recomendo começarmos pela **Fase 0 + o núcleo do Fase 1** (autenticação multi-tenant + cadastro de clientes + agenda básica), que já entrega um produto utilizável.
