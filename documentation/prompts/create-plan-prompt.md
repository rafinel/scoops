---
name: create-plan
description: Criar um Plan SDD como ledger de fases, progresso, evidências e handoff para uma Spec de feature.
---

# Criar Plan

Crie Plan somente quando a Spec `open` possuir fases dependentes, múltiplos
workspaces, migration relevante, risco elevado ou necessidade real de ledger.
Para Spec pequena, use `implement-spec` diretamente.

O Orchestrator cria o Plan na task atual e mantém a relação com a revisão da
Spec:

```yaml
spec: ../spec.md
evaluation: ../evaluation.md
spec_revision: 1
status: pending
github_issue: <github-issue-url, opcional>
```

Quando existir uma GitHub Issue, preserve sua URL e mantenha a rastreabilidade
entre issue, requisito, critério de aceite e tarefa do Plan. Este projeto não
usa Jira: não invente chaves Jira nem adicione metadados `jira_tickets`. Quando
não existir GitHub Issue, registre a demanda direta ou outra fonte real sem
fabricar rastreabilidade.

Inclua:

- objetivo, escopo e fora de escopo;
- uma única tabela **Phase and parallel execution ledger**, sem tabelas
  separadas de fases e paralelismo. A tabela deve conter exatamente as colunas:
  `Wave`, `Lane`, `Phase`, `Name`, `Depends on`, `Parallel with`, `Status` e
  `Exit condition`;
- fases ordenadas e dependências representadas nessa tabela;
- uma pré-condição Core na Wave 1, seguida por lanes independentes de Server e
  Web quando ambos dependerem apenas de contratos estáveis do Core e contratos
  de transporte definidos pela Spec; faça o join dessas lanes somente na
  validação integrada e no julgamento final;
- tarefas com paths, resultado observável e IDs `RF-*`/`CA-*`;
- campo `parallelizable` e motivo quando aplicável;
- paths não sobrepostos e ownership explícito para arquivos compartilhados;
  coordene instalação de pacotes e atualização do lockfile pelo Orchestrator
  antes de Builders paralelos editarem código de aplicação;
- sensores e evidências esperados por fase;
- riscos, findings ativos, tentativas, estado e próxima ação;
- sensores e evidências por fase; o veredito do único Judge Implementation fica
  reservado para a implementação inteira.

Para qualquer fase de UI com Pencil, inclua explicitamente no ledger a
inspeção dos nodes e tokens como pré-condição, o mapeamento página/estado →
Pencil node ID, a implementação por página e a validação visual integrada.
Pencil é a fonte visual normativa: páginas com composições diferentes não
podem ser reduzidas a uma aproximação compartilhada. A fase de validação só
fica `verified` quando cada página mapeada tiver sido conferida no viewport do
design com Browser-use via CDP, incluindo screenshot, árvore de acessibilidade,
DOM/layout e findings. Para validação manual de UI, use Browser-use, nunca
Playwright.

Estados de tarefa: `pending`, `implementing`, `validating`, `verified`.
Estados de fase: `pending`, `in_progress`, `awaiting_judgment`, `failed`,
`accepted`.

Somente o Orchestrator atualiza o Plan. Builders implementam; Judges avaliam
read-only. Todos são subagentes da task atual. Não use nova thread.
