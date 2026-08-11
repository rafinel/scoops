---
name: resolve-pr-pendencies
description: Resolver checks de CI e conversas de review até o PR ficar mergeable.
---

# Resolver pendências de PR

Trabalhe na sessão atual e sempre contra o `HEAD` mais recente.

Use o PR, a Spec, o PRD no Confluence e os tickets Jira associados como contexto
de rastreabilidade. GitHub Issues e milestones não fazem parte desse fluxo.
Consulte o Confluence/Jira quando necessário, mas não altere status ou conteúdo
sem instrução explícita.

1. Inspecione status mergeable, checks e conversas não resolvidas.
2. Classifique cada pendência como falha determinística, teste, build, ambiente,
   feedback de review ou conflito com Spec/Architecture.
3. Reproduza localmente usando os scripts reais documentados em
   `documentation/tooling.md`: `pnpm lint`, `pnpm check-types`, `pnpm test` e
   `pnpm build`, além de integração/e2e quando aplicável.
4. Corrija a causa no menor escopo seguro; não desative regras nem adicione
   exclusões para esconder regressões.
5. Aplique `format`, reexecute os sensores invalidados e faça revisão do diff.
6. Responda/resolva conversas apenas após a correção existir no branch.
7. Faça push e aguarde novamente Quality Gate, testes e build do novo `HEAD`.

Mudança de produto, Contract, arquitetura ou segurança precisa atualizar as
fontes normativas antes de prosseguir. Encerre somente com checks verdes,
conversas bloqueantes resolvidas e PR mergeable.
