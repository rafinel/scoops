---
title: Destino do estoque por linha no cancelamento de pedido
status: in_progress
revision: 1
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/45
scope:
  - packages/core/src/pdv
  - packages/core/src/mrp
  - packages/validation/src/pdv
  - apps/server/src/pdv
  - apps/server/src/shared/provision/pdv-order-registration
  - apps/server/src/shared/database/drizzle/migrations
  - apps/web/src/ui/pdv
  - apps/web/src/rest/services/pdv-service.ts
last_updated_at: 2026-09-26
---

# 1. Context and scope

**Objetivo e origem.** Issue #45; modo `complete`. Permitir ao gerente definir devolução ou perda por linha vendida ao cancelar pedido, com histórico fiel e operação atômica.

**Estado atual.** O cancelamento devolve automaticamente todo consumo elegível, agrupado por destino; o diálogo não oferece escolha e o histórico não atribui o resultado a cada linha.

| Área | Incluído | Excluído |
| --- | --- | --- |
| Cancelamento | Escolha por linha, padrão devolução; perda auditável; destino excluído sem movimentação | Reembolso, pagamento, resultado automático por categoria |
| Histórico | Devolução/perda por linha e fatos ignorados auditáveis | Mudança de snapshots comerciais ou exibição de ignorados nos detalhes |
| Estoque | Retorno elegível na mesma transação do cancelamento | Reclassificação retroativa da venda original |

| Fonte | Entrega | Observação |
| --- | --- | --- |
| PDV PRQ-15 | full | Destino por linha e ciclo de cancelamento |
| PDV PRQ-09, PRQ-10, PRQ-11, PRQ-12 | partial | Somente projeções, acesso e acessibilidade afetados |
| MRP PRQ-03 | partial | Saldo e transação de devolução; perda não cria mutação de estoque |

**Decisões aceitas.** Destino excluído não recebe alteração de saldo; o fato ignorado permanece para auditoria, mas os detalhes mostram somente devoluções e perdas. A perda registra cada consumo, inclusive acompanhamentos. O frame `dPHci` foi alinhado a essa apresentação.

# 2. Implementation Contract

| ID | PRQ/source coverage | Comportamento exigido |
| --- | --- | --- |
| FR-01 | PDV PRQ-15, PRQ-11 | Somente gerente da loja ativa pode cancelar pedido registrado, sem limite de idade, após confirmação explícita. |
| FR-02 | PDV PRQ-15 | Cada linha vendida oferece devolução ou perda, inicialmente devolução; a escolha cobre todo consumo da linha. |
| FR-03 | PDV PRQ-15; MRP PRQ-03 | Cancelamento, devoluções elegíveis e fatos de perda/ignorado são atômicos; falha preserva pedido e saldos. |
| FR-04 | PDV PRQ-09, PRQ-10, PRQ-15 | Histórico preserva snapshots da venda e atribui a cada linha seus consumos devolvidos ou perdidos; ignorados permanecem auditáveis sem aparecer nos detalhes. |
| FR-05 | PDV PRQ-15, PRQ-12 | Diálogo e detalhes oferecem estados, foco, teclado, leitura e layout responsivos. |

| ID | FR coverage | Requisito | Given | When | Then | Evidência esperada |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Autorização e isolamento | Pedidos de duas lojas e perfis gerente/operador | Solicitar cancelamento | Só gerente da loja dona do pedido obtém sucesso; repetição e pedido inexistente são rejeitados | Core e controller; MV-02 |
| AC-02 | FR-02 | Escolha integral por linha | Pedido com linhas e acompanhamentos | Abrir diálogo, alterar uma linha e confirmar | Todas começam em devolução; envio inclui exatamente uma escolha por linha, inclusive a alterada | Widget e schema; MV-01 |
| AC-03 | FR-03 | Atomicidade | Destinos existentes e excluídos; falha injetada | Cancelar | Devolvidos recebem saldo/transação; excluídos geram fato ignorado; perdas geram fatos sem saldo; falha reverte tudo | Core e controller com PostgreSQL; MV-02 |
| AC-04 | FR-04 | Histórico íntegro | Pedido cancelado com devolução e perda | Abrir detalhes | Resultado é atribuível à linha; dados originais permanecem; ignorado não aparece na UI | Mapper, controller, widget; MV-01 |
| AC-05 | FR-03, FR-04 | Concorrência e tentativa | Dois cancelamentos simultâneos | Confirmar ambos | Só um transiciona e modifica saldo; outro recebe conflito sem duplicação | Core e controller com PostgreSQL |
| AC-06 | FR-03, FR-05 | Recuperação | Erro de persistência | Confirmar | Mensagem permite tentar novamente; pedido permanece registrado e sem efeito parcial | Controller e widget; MV-02 |
| AC-07 | FR-05 | Acessibilidade e responsividade | Desktop e 375 × 812 | Navegar por teclado e confirmar | Escolhas têm rótulos, seleção e foco perceptíveis; conteúdo não corta; diálogo devolve foco ao disparador | Widget; MV-01 |

**Restrições.** `Registered → Canceled` é irreversível. Motivo continua opcional e limitado a 500 caracteres. Operadores podem consultar detalhes, mas não iniciar o cancelamento. A perda é fato de cancelamento PDV, sem nova baixa MRP; o saldo já foi consumido na venda.

## Design Contract

[Manifest de design](./design/manifest.md): `c52HsC` (657 × 894) para confirmação; `dPHci` (1481 × 1050) para detalhes. Em 375 × 812, empilhar as escolhas sob cada item e permitir rolagem do diálogo. Usar os tokens existentes. A indicação de devolução/perda pode ser apresentada como texto ou badge acessível junto à linha; dados comerciais e ordem de leitura seguem o frame. Não mostrar ignorados nos detalhes.

# 3. Technical Contract

## Estado técnico atual

| Evidência | Responsabilidade atual | Lacuna |
| --- | --- | --- |
| `CancelOrderUseCase`, `StockProvider.restore`, `RestoreOrderStockUseCase` | Transação PDV chama restauração MRP; alvos agregados por produto/marca | Não preserva escolha e atribuição por linha |
| `order_stock_restorations`, `DrizzleOrderMapper` | Guardam resultado devolvido/ignorado por destino | Faltam identidade de linha e perda |
| `cancelOrderSchema`, `CancelOrderController`, `PdvService` | Aceitam apenas motivo | Faltam escolhas validadas e mapeadas |
| `CancelOrderDialog`, `OrderItems` | Confirmam e exibem venda | Faltam seleção e resultado por linha |

**Fluxo.** O cliente envia o identificador da linha por posição imutável no pedido e sua disposição. O controlador valida forma e sessão; o caso de uso valida gerente, loja, conjunto exato de linhas e estado sob bloqueio. A transação PDV delega apenas alvos escolhidos para devolução ao provedor MRP no mesmo contexto transacional; MRP atualiza saldos e transações ou retorna `skipped`. PDV persiste por linha todos os resultados, inclusive perdas, e muda o status. Falha propaga e reverte tudo. Não há evento externo. Repetição após sucesso retorna conflito; erro transitório permite nova tentativa.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| HTTP cancel | `cancelOrderSchema` | `CancelOrderController` | `CancelOrderInput` | `lineDispositions: {linePosition, disposition}[]`; índices únicos, completos e válidos no use case | 422 sintático; 400 semântico |
| Core ↔ MRP | `CancelOrderUseCase` | `StockProvider.restore` | `StockRestorationRequest` | Cada alvo conserva posição da linha; MRP pode consolidar bloqueios, mas retorna resultado por consumo | Transação PDV |
| Database ↔ REST | `DrizzleOrderMapper` | `OrderResponseDto` | `OrderCancellation` | `outcomes` por linha e consumo; datas ISO na resposta | Mapper e DTO |

## packages/core — Domain

| Path | Change | Declaration | Contract |
| --- | --- | --- | --- |
| `packages/core/src/pdv/domain/structures/order-line-disposition.ts` | Create | `OrderLineDisposition` | Estrutura `{ linePosition: number; disposition: 'return' \| 'loss' }`; posição não negativa; escolha por linha. |
| `packages/core/src/pdv/domain/structures/order-stock-restoration.ts` | Modify | `OrderStockRestoration` | Adiciona `linePosition?` para legado e outcome `lost`; preserva produto/marca, nome e quantidade. |
| `packages/core/src/pdv/domain/structures/order-cancellation.ts` | Modify | `OrderCancellation` | `outcomes` substitui `restorations`, sem alterar metadados de cancelamento. |
| `packages/core/src/pdv/domain/structures/stock-restoration-target.ts` | Modify | `StockRestorationTarget` | Adiciona `linePosition` para atribuir o resultado à linha. |
| `packages/core/src/pdv/domain/structures/stock-restoration-request.ts` | Modify | `StockRestorationRequest` | Mantém ator, loja, pedido e instante; alvos passam a incluir linha. |
| `packages/core/src/pdv/domain/structures/index.ts` | Modify | Exportações | Expõe a nova estrutura. |
| `packages/core/src/pdv/domain/entities/fakers/order-faker.ts` | Modify | `OrderFaker` | Fatos cancelados compatíveis com `outcomes`. |

```ts
export type OrderLineDisposition = { readonly linePosition: number; readonly disposition: 'return' | 'loss' }
export type OrderStockRestoration = { readonly linePosition?: number; readonly productId: string; readonly productName: string; readonly brandId?: string; readonly brandName?: string; readonly quantity: number; readonly outcome: 'restored' | 'skipped' | 'lost' }
export type OrderCancellation = { readonly canceledAt: Date; readonly canceledBy: string; readonly canceledByName: string; readonly reason?: string; readonly outcomes: readonly OrderStockRestoration[] }
export type StockRestorationTarget = { readonly linePosition: number; readonly productId: string; readonly productName: string; readonly brandId?: string; readonly brandName?: string; readonly quantity: number }
export type StockRestorationRequest = { readonly establishmentId: string; readonly orderId: string; readonly performedBy: string; readonly performedByName: string; readonly occurredAt: Date; readonly targets: readonly StockRestorationTarget[] }
```

**Schema — `OrderLineDisposition`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `linePosition` | `number` | Yes | Inteiro ≥ 0 | Índice da linha imutável |
| `disposition` | `'return' \| 'loss'` | Yes | Enum | Decisão do gerente |

**Schema — `OrderStockRestoration`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `linePosition` | `number` | No | Inteiro ≥ 0 | Ausente só em fatos legados |
| `productId` | `string` | Yes | UUID | Produto consumido |
| `productName` | `string` | Yes | Não vazio | Nome preservado |
| `brandId` | `string` | No | UUID; par com nome | Marca consumida |
| `brandName` | `string` | No | Não vazio; par com ID | Nome preservado |
| `quantity` | `number` | Yes | Positivo | Quantidade consumida |
| `outcome` | `'restored' \| 'skipped' \| 'lost'` | Yes | Enum | Resultado do consumo |

**Schema — `OrderCancellation`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `canceledAt` | `Date` | Yes | Data válida | Instante do cancelamento |
| `canceledBy` | `string` | Yes | UUID | Gerente |
| `canceledByName` | `string` | Yes | Não vazio | Nome preservado |
| `reason` | `string` | No | Até 500 caracteres | Motivo opcional |
| `outcomes` | `readonly OrderStockRestoration[]` | Yes | Coerente com linhas | Fatos por consumo |

**Schema — `StockRestorationTarget`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `linePosition` | `number` | Yes | Inteiro ≥ 0 | Linha de origem |
| `productId` | `string` | Yes | UUID | Produto alvo |
| `productName` | `string` | Yes | Não vazio | Nome preservado |
| `brandId` | `string` | No | UUID; par com nome | Marca alvo |
| `brandName` | `string` | No | Não vazio; par com ID | Nome preservado |
| `quantity` | `number` | Yes | Positivo | Quantidade a devolver |

**Schema — `StockRestorationRequest`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `establishmentId` | `string` | Yes | UUID | Loja ativa |
| `orderId` | `string` | Yes | UUID | Pedido |
| `performedBy` | `string` | Yes | UUID | Gerente |
| `performedByName` | `string` | Yes | Não vazio | Nome preservado |
| `occurredAt` | `Date` | Yes | Data válida | Instante |
| `targets` | `readonly StockRestorationTarget[]` | Yes | Sem alvo duplicado por consumo | Alvos escolhidos |

Cada campo conserva o tipo e presença do código acima; `brandId` e `brandName` devem coexistir. Quantidade positiva, nomes não vazios e posição inteira não negativa são verificados nas fronteiras de entrada/persistência; completude e unicidade das linhas pertencem ao caso de uso. Ausência de `linePosition` representa somente um fato anterior à migração e não é exibida como resultado por linha. `Order` e `OrderLine` permanecem com forma atual: a posição é a ordem preservada do array `lines`.

## packages/core — MRP Domain

| Path | Change | Declaration | Contract |
| --- | --- | --- | --- |
| `packages/core/src/mrp/domain/structures/order-stock-restoration-request.ts` | Modify | `OrderStockRestorationRequest` | Cada target recebe `linePosition` do PDV, preservando os campos atuais. |
| `packages/core/src/mrp/domain/structures/order-stock-restoration.ts` | Modify | `OrderStockRestoration` | Cada resultado devolvido/ignorado retém `linePosition`; MRP não cria resultado `lost`. |

```ts
export type OrderStockRestorationRequest = { readonly establishmentId: string; readonly orderId: string; readonly performedBy: string; readonly performedByName: string; readonly occurredAt: Date; readonly targets: readonly { readonly linePosition: number; readonly productId: string; readonly productName: string; readonly brandId?: string; readonly brandName?: string; readonly quantity: number }[] }
export type OrderStockRestoration = { readonly linePosition: number; readonly productId: string; readonly productName: string; readonly brandId?: string; readonly brandName?: string; readonly quantity: number; readonly outcome: 'restored' | 'skipped' }
```

**Schema — MRP `OrderStockRestorationRequest`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `establishmentId` | `string` | Yes | UUID | Loja |
| `orderId` | `string` | Yes | UUID | Pedido |
| `performedBy` | `string` | Yes | UUID | Gerente |
| `performedByName` | `string` | Yes | Não vazio | Nome preservado |
| `occurredAt` | `Date` | Yes | Data válida | Instante |
| `targets` | `readonly { linePosition: number; productId: string; productName: string; brandId?: string; brandName?: string; quantity: number }[]` | Yes | Posição ≥ 0, quantidade positiva, marca completa | Alvos por consumo |

**Schema — MRP `OrderStockRestoration`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `linePosition` | `number` | Yes | Inteiro ≥ 0 | Linha de origem |
| `productId` | `string` | Yes | UUID | Produto |
| `productName` | `string` | Yes | Não vazio | Nome preservado |
| `brandId` | `string` | No | UUID; par com nome | Marca |
| `brandName` | `string` | No | Não vazio; par com ID | Nome preservado |
| `quantity` | `number` | Yes | Positivo | Quantidade |
| `outcome` | `'restored' \| 'skipped'` | Yes | Enum | Resultado MRP |

Em ambas as estruturas, `linePosition` é inteiro não negativo e identifica a ordem da linha registrada; demais campos mantêm tipos e presença atuais. `targets` é não vazio quando invocado para devolução; o caso de uso PDV omite a chamada quando não há devoluções. O barrel MRP já exporta as duas estruturas e permanece inalterado.

## packages/core — Use cases e Interfaces

| Path | Change | Declaration | Contract |
| --- | --- | --- | --- |
| `packages/core/src/pdv/use-cases/cancel-order-use-case.ts` | Modify | `CancelOrderRequest`, `CancelOrderUseCase.execute` | Exige escolha exata de cada índice; Manager/loja/estado sob lock; chama MRP apenas para devolução; cria perdas por consumo; persiste resultado e status na transação. |
| `packages/core/src/pdv/use-cases/tests/cancel-order-use-case.test.ts` | Modify | Suite `CancelOrderUseCase` | Padrão explícito, perda, múltiplos consumos, excluídos, rejeições, rollback e disputa. |
| `packages/core/src/mrp/use-cases/restore-order-stock-use-case.ts` | Modify | `RestoreOrderStockUseCase.execute` | Preserva posição por consumo no resultado; bloqueia produtos em ordem estável e evita duplicação de saldo. |
| `packages/core/src/mrp/use-cases/tests/restore-order-stock-use-case.test.ts` | Modify | Suite `RestoreOrderStockUseCase` | Retorno por linha, alvo excluído e rollback. |
| `packages/core/src/pdv/interfaces/stock-provider.ts` | Modify | `StockProvider.restore` | Preserva atribuição por linha através do port. |
| `packages/core/src/pdv/interfaces/pdv-service.ts` | Modify | `PdvService.cancelOrder` | Input com `reason?` e `lineDispositions`; resposta `OrderDetails`. |

## packages/validation — Validation

| Path | Change | Schema/declaration | Contract |
| --- | --- | --- | --- |
| `packages/validation/src/pdv/cancel-order-schema.ts` | Modify | `cancelOrderSchema`, `CancelOrderInput` | `lineDispositions` array não vazio de `{linePosition: inteiro >= 0, disposition: 'return' \| 'loss'}`; índices únicos; motivo atual. |
| `packages/validation/src/index.ts` | Modify | Barrel | Continua expondo schema e tipo. |

## apps/server — REST e Provision

| Path | Change | Declaration/operation | Contract |
| --- | --- | --- | --- |
| `apps/server/src/pdv/rest/controllers/cancel-order.controller.ts` | Modify | `PATCH /orders/:orderId/cancel` | Mantém autenticação, Manager, UUID, Zod e estados; repassa escolhas ao use case; documenta erro semântico. |
| `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts` | Modify | Controller suite | Contrato HTTP, autorização, loja, transação e resposta. |
| `apps/server/src/pdv/rest/dtos/order-response.dto.ts` | Modify | `OrderResponseDto`, cancellation DTO | Serializa `outcomes` e `linePosition?` (ausente para legado), preserva snapshot e datas ISO. |
| `apps/server/rest-client/pdv/orders.rest` | Modify | Exemplos `orders` | Mantém todas as rotas do grupo; cancelamento inclui escolhas de todas as linhas, base URL/identificadores reutilizáveis e sem segredo. |
| `apps/server/src/shared/provision/pdv-order-registration/mrp-stock-provider.ts` | Modify | `MrpStockProvider.restore` | Propaga linha sem tipo de infraestrutura para Core; falhas retornam à transação. |

## apps/server — Database

| Path | Change | Declaration | Contract |
| --- | --- | --- | --- |
| `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-outcome-model.ts` | Modify | Enum `pdv_order_stock_restoration_outcome` | Acrescenta `lost`. |
| `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-model.ts` | Modify | `orderStockRestorationModel` | Adiciona `linePosition`; linhas antigas recebem atribuição histórica quando possível, sem inventar escolha. |
| `apps/server/src/pdv/database/drizzle/mappers/drizzle-order-mapper.ts` | Modify | `DrizzleOrderMapper` | Mapeia `outcomes`, inclusive perda e índice opcional de linha legada; snapshots intocados. |
| `apps/server/src/pdv/database/drizzle/repositories/drizzle-orders-repository.ts` | Modify | `DrizzleOrdersRepository.cancel` | Grava todos os resultados na transação, lê por ordem/linha; comparação de status mantém exclusividade. |
| `apps/server/src/shared/database/drizzle/migrations/0027_order_cancellation_stock_disposition.sql` | Generate | Migração Drizzle | Gerar com `pnpm --filter server db:migration:generate --name order_cancellation_stock_disposition`; saída derivada dos models, sem edição manual. |
| `apps/server/src/shared/database/drizzle/migrations/meta/0027_snapshot.json` | Generate | Snapshot Drizzle | Derivado dos models pelo mesmo comando. |
| `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Generate | Journal Drizzle | Registrar migração gerada. |

**Tabela `order_stock_restorations`.**

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | uuid | No | — | Chave do fato |
| `order_id` | uuid | No | — | Pedido |
| `position` | integer | No | — | Ordem do fato |
| `line_position` | integer | Yes | — | Linha; null para legado |
| `product_id` | uuid | No | — | Produto preservado |
| `product_name` | text | No | — | Nome preservado |
| `brand_id` | uuid | Yes | — | Marca preservada |
| `brand_name` | text | Yes | — | Nome preservado |
| `quantity` | numeric(18,3) | No | — | Quantidade |
| `outcome` | enum | No | — | `restored`, `skipped`, `lost` |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `pdv_order_stock_restorations_order_position_unique` | `order_id`, `position` | unique | Ordem única por pedido |
| `pdv_order_stock_restorations_order_line_position_idx` | `order_id`, `line_position`, `position` | btree | Leitura por linha |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| PK/FK existentes | key | `id` PK; `order_id` FK | Integridade |
| `line_position_non_negative` | check | Null ou ≥ 0 | Legado e novos índices |
| Checks existentes | check | posição ≥ 0; nome não vazio; quantidade > 0; marca completa | Fatos válidos |

**Cross-database.** Enum PostgreSQL recebe `lost` antes de escrita; Drizzle continua a fonte do schema. **Migration delivery.** Colunas existentes mantidas; nova `line_position integer` inicialmente anulável para linhas históricas, obrigatória para novos resultados. Índice `(order_id, line_position, position)` apoia leitura por linha; manter unicidade `(order_id, position)`. Check de posição não negativa quando presente; `outcome` aceita `restored`, `skipped`, `lost`. Migrar sem alterar fatos antigos: histórico legado sem linha é mostrado como legado, e a nova UI não infere atribuição. Gerar após atualizar models, revisar SQL e aplicar em PostgreSQL antes de validar endpoints. O nome contratual `0027_order_cancellation_stock_disposition.sql` usa o próximo índice do journal e a opção `--name`; confirmar o índice antes da geração e retornar à Spec se outra migração for integrada antes.

## apps/web — REST e UI

| Widget | Kind | Parent/entry | Direct children | Public contract | Behavior owner |
| --- | --- | --- | --- | --- | --- |
| `OrderDetailsPage` | Page | rota existente de detalhes | `CancelOrderDialog`, `OrderItems`, `OrderSummary` e widgets existentes | `OrderDetails` e callbacks atuais | `useOrderDetailsPage` |
| `CancelOrderDialog` | Component | `OrderDetailsPage` | — | pedido, abertura, sucesso; escolhas por linha | `useCancelOrderDialog` |
| `OrderItems` | Component | `OrderDetailsPage` | — | linhas e resultados correspondentes | Renderização pura |

```text
apps/web/src/ui/pdv/widgets/pages/order-details-page/
├── cancel-order-dialog/
│   ├── index.tsx
│   ├── use-cancel-order-dialog.ts
│   └── tests/
│       ├── cancel-order-dialog.test.tsx
│       └── use-cancel-order-dialog.test.ts
└── order-items/
    └── index.tsx
```

| Path | Change | Declaration/surface | Contract |
| --- | --- | --- | --- |
| `apps/web/src/ui/pdv/hooks/use-cancel-order-action.ts` | Modify | `useCancelOrderAction` | Aceita e repassa `lineDispositions` ao serviço; mantém invalidação de consultas e erro recuperável. Testado pelo widget consumidor, sem teste direto. |
| `apps/web/src/rest/services/pdv-service.ts` | Modify | `cancelOrder` e mapper de resposta | Envia escolhas, preserva erros e mapeia resultados por linha; métodos alheios intactos. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/index.tsx` | Modify | `CancelOrderDialog` | Controles rotulados por linha, padrão devolução, aviso e submissão; foco e rolagem. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/use-cancel-order-dialog.ts` | Modify | `useCancelOrderDialog` | Estado de escolhas, form Zod, envio, reset ao fechar/sucesso, erro recuperável. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/cancel-order-dialog.test.tsx` | Modify | Widget suite | Rótulos, seleções, disabled, foco e erro. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/use-cancel-order-dialog.test.ts` | Modify | Hook suite | Escolhas por linha, envio e recuperação. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-items/index.tsx` | Modify | `OrderItems` | Exibe devolução/perda atribuídas à linha; ignora skipped; preserva dados originais. |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx` | Modify | `OrderDetailsPage` suite | Composição e resultado de cancelamento. |

**Decisão técnica.** Posição da linha é chave do contrato de cancelamento porque a venda preserva ordem e não expõe ID de linha no domínio. Alternativa: adicionar ID público permanente a `OrderLine`; aumentaria migração e impacto em todos os consumidores. Posições são imutáveis no pedido registrado. O banco conserva linhas legadas sem atribuição em vez de fabricar dados.

# 4. Validation Contract

| Test file | Tipo | Alvo | Meta |
| --- | --- | --- | --- |
| `packages/core/src/pdv/use-cases/tests/cancel-order-use-case.test.ts` | unit | Decisão PDV | Autorização, escolha completa, perda, rollback, disputa |
| `packages/core/src/mrp/use-cases/tests/restore-order-stock-use-case.test.ts` | unit | Devolução MRP | Resultado por alvo e exclusão |
| `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts` | integration | HTTP/PostgreSQL | Sessão, loja, persistência e atomicidade |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/cancel-order-dialog.test.tsx` | component | Diálogo | Acesso e estados |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/use-cancel-order-dialog.test.ts` | component | Hook do diálogo | Envio, falha e reset |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx` | component | Detalhes | Atribuição visual e snapshots |

| Test file | Caso | Descrição | Assertivas |
| --- | --- | --- | --- |
| `cancel-order-use-case.test.ts` | escolhas e concorrência | Linhas mistas, perfil e loja, repetição | Resultado por linha, saldos e status únicos |
| `restore-order-stock-use-case.test.ts` | alvos | Existente e excluído | Transação só para existente; ignorado preservado |
| `cancel-order.controller.test.ts` | HTTP real | Corpo inválido, perda, falha, loja | Status, resposta, linhas persistidas, rollback |
| `cancel-order-dialog.test.tsx` | interação | Padrão, troca, teclado, erro | Rótulos e envio acessíveis |
| `use-cancel-order-dialog.test.ts` | submissão | Sucesso/falha | Payload completo, reset e retry |
| `order-details-page.test.tsx` | histórico | Misto, legado e ignorado | Venda intacta, devolução/perda por linha, ignorado oculto |

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Core e controller | MV-02 | `./evaluation.md` EV-01 |
| AC-02 | Core, schema via controller, widget | MV-01 | EV-02 |
| AC-03 | Core, MRP, controller | MV-02 | EV-03 |
| AC-04 | Mapper via controller, widget | MV-01 | EV-04 |
| AC-05 | Core e controller | — | EV-05 |
| AC-06 | Controller e widget | MV-02 | EV-06 |
| AC-07 | Widget | MV-01 | EV-07 visual |

**MV-01 — Gerente, escolha e detalhes.** Requer PostgreSQL, server e web saudáveis, gerente semeado e pedido com três linhas e acompanhamentos. Em `/pdv/orders/:orderId` a 1481 × 1050 e 375 × 812: (1) abrir Cancelar pedido por teclado; (2) confirmar que cada linha inicia em devolução; (3) marcar uma como perda e preencher motivo; (4) confirmar; (5) abrir detalhes cancelados e comparar aos PNGs do manifest. Verificar URL, `PATCH` com escolhas, status e fatos persistidos, saldos, rótulos, foco, ordem DOM, console e requisições falhas. Registrar screenshots recentes em `apps/web/test-results/` e EV-02/04/07. Não resetar seed automaticamente; parar processos iniciados.

**MV-02 — Permissão, exclusão e falha.** Com gerente, operador e pedidos em duas lojas, a 375 × 812: (1) comprovar ausência da ação para operador; (2) tentar acesso cruzado; (3) cancelar pedido com destino excluído e confirmar saldo inalterado para esse alvo, fato `skipped` persistido e ausência na UI; (4) provocar falha de persistência em fixture isolada e confirmar pedido registrado, saldos intactos e mensagem recuperável; (5) repetir após retirar falha. Inspecionar URL, rede, banco, foco, console e requests falhos; registrar EV-01/03/06 e limpar fixture sem derrubar serviços compartilhados.

| Command | Finalidade |
| --- | --- |
| `pnpm --filter @scoops/validation check:types` | Schema compartilhado |
| `pnpm --filter @scoops/core test:coverage` | Core PDV/MRP e piso sem regressão |
| `pnpm --filter server test:coverage` | Controller, mapper e PostgreSQL |
| `pnpm --filter web test:coverage` | Diálogo e detalhes |
| `pnpm --filter web test:integration` | Rotas com transporte simulado; não prova fluxo real |
| `pnpm check:test-integrity` | Proibir testes fora das fronteiras |
| `pnpm check:architecture` | Dependências |
| `pnpm --filter server db:migration:generate --name order_cancellation_stock_disposition` | Derivar migração dos models |
| `pnpm --filter server db:migration:apply` | Validar migração local |

Verificar paridade de `apps/server/rest-client/pdv/orders.rest`: cada operação do grupo representada uma vez, com rota, corpo e headers atuais. Executar Playwright CLI para MV-01/MV-02 após saúde dos serviços e contas locais; registrar evidência real em [evaluation.md](./evaluation.md) durante implementação.

# 5. Documentation alignment and revision history

| Documento | Autoridade | Estado | Confirmação/mudança |
| --- | --- | --- | --- |
| `documentation/prds/pdv.md` | Produto | changed | Resultado ignorado auditável, oculto dos detalhes |
| `documentation/prds/mrp.md` | Saldo | confirmed | MRP mantém autoridade de estoque |
| `documentation/architecture.md` | Transação e direção | confirmed | PDV orquestra, MRP executa estoque |
| `documentation/modules.md` | Ownership | confirmed | Perda/cancelamento PDV, saldo MRP |
| `documentation/design.md` | Tokens e UI | confirmed | Reuso de tokens |
| `documentation/tooling.md` | Comandos | confirmed | pnpm, Drizzle, Playwright CLI |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| `documentation/rules/code-conventions-rules.md` | TS | working tree 2026-09-26 |
| `documentation/rules/core-package-rules.md` | Core | working tree 2026-09-26 |
| `documentation/rules/use-case-testing-rules.md` | Use cases | working tree 2026-09-26 |
| `documentation/rules/validation-package-rules.md` | Zod | working tree 2026-09-26 |
| `documentation/rules/rest-layer-rules.md` | HTTP | working tree 2026-09-26 |
| `documentation/rules/controllers-testing-rules.md` | Controller | working tree 2026-09-26 |
| `documentation/rules/database-layer-rules.md` | Drizzle | working tree 2026-09-26 |
| `documentation/rules/provision-layer-rules.md` | Adapter | working tree 2026-09-26 |
| `documentation/rules/server-app-layer-rules.md` | Server | working tree 2026-09-26 |
| `documentation/rules/ui-layer-rules.md` | Widgets | working tree 2026-09-26 |
| `documentation/rules/widget-testing-rules.md` | Widget tests | working tree 2026-09-26 |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-09-26 | Contrato inicial de destino por linha | Issue #45 e decisões confirmadas |
