---
name: create-spec
description: Criar e julgar uma Spec de feature, compacta ou completa, a partir de PRD do Confluence, ticket Jira, report ou demanda direta.
---

# Criar Spec

O Orchestrator conduz a autoria na task atual. Não crie nova thread. Use Spec
somente para uma entrega relacionada a uma feature. Para manutenção transversal
sem Contract de feature, use fluxo direto.

## Classificação

Identifique a origem: `prd`, `jira-ticket`, `report` ou `direct-request`. O PRD
é uma página do Confluence e toda demanda rastreável deve usar um ticket Jira;
não use GitHub Issue ou milestone como fonte de produto. Defina `scope` com
workspaces, diretórios ou arquivos. Use modo compacto para uma
mudança pequena e coesa; use modo completo quando houver múltiplos fluxos,
risco, integrações ou fases.

## Fontes

Leia a origem da demanda no Confluence/Jira, `documentation/architecture.md`,
Rules aplicáveis, `documentation/sdd.md` e os paths reais da codebase. Use os
MCPs disponíveis quando aplicáveis. Se o Confluence ou Jira não estiver
acessível, registre a limitação e não invente requisitos ou critérios.

Resolva ambiguidades materiais antes da solução técnica. Registre premissas e
questões pendentes; antes de `open`, questões pendentes devem estar resolvidas
e premissas críticas confirmadas ou explicitamente aceitas com risco.

## Arquivo e Contract

Crie `documentation/features/<domínio>/<feature>/spec.md`. O `plan.md` é
opcional e só deve ser criado quando o tamanho, risco ou dependências exigirem
fases e ledger; `evaluation.md` é obrigatório após a implementação/julgamento,
mesmo sem Plan. A única exceção é uma Spec abandonada antes da implementação.
Para qualquer
alteração em feature já implementada, use
`documentation/features/<domínio>/<feature>/changes/<nome-da-mudanca>/`. Use um
nome curto em kebab-case; o ticket permanece no frontmatter. Em bugs ou
security, não copie o relatório privado para o repositório; em evolução de
produto, registre a demanda do ticket como origem da mudança.

```yaml
---
title: <título>
status: draft
revision: 1
source:
  type: <prd|jira-ticket|report|direct-request>
  ref: <confluence-url|jira-url|report-url|path|codex-task>
prd: <confluence-url, opcional>
jira_tickets:
  - <PROJ-123>
scope:
  - <workspace|diretório|arquivo>
last_updated_at: YYYY-MM-DD
---
```

O corpo deve conter contexto, escopo, Contract, estado atual, solução técnica,
plano de validação, referência para `evaluation.md`, alinhamento documental e
amendments. As avaliações e evidências finais não são duplicadas na Spec: são
registradas em `evaluation.md` após a implementação ou julgamento.

Use somente `RF-*` e `CA-*` como IDs obrigatórios:

```md
| CA | RF | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | RF-01 | pré-condição | ação | resultado | teste/browser/sensor |
```

Segurança, performance e arquitetura entram como critérios de aceitação ou
restrições técnicas. Não use `RN-*`, `RNF-*`, `RA-*`, comentários
`harness:evidence`, gates próprios ou baselines.

Quando `source.type` for `report`, prefira a URL direta do ticket Jira. Para
Security Reports, só use a URL se o repositório tiver controle de acesso
compatível; nunca copie o conteúdo sensível do ticket.

Declare as validações aplicáveis conforme `documentation/tooling.md`: `pnpm format`,
lint, typecheck, testes e, quando houver UI ou REST, integração/e2e e validação
no navegador. Build é validação final do CI.

## Rastreabilidade

Relacione cada requisito ao PRD do Confluence e aos tickets Jira aplicáveis.
Preserve todas as chaves em `jira_tickets` na Spec e não altere o status dos
tickets automaticamente.

## Judge Spec

Acione `judge-spec-agent` como subagente read-only `Judge Spec` na task atual.
Envie a origem, Spec, pesquisa, Architecture e Rules, sem narrativa persuasiva.

- `failed`: encaminhe findings ao Orchestrator, corrija e avalie novamente;
- `accepted`: altere a Spec para `status: open` e roteie para `implement-spec`
  ou `create-plan`.

Não crie nova thread para pesquisa ou julgamento.
