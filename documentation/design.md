# Design System — Scoops

> Sorvete · Açaí · Gelado

Guia de design do produto Scoops. Alinha tokens, componentes e padrões de tela para consistência entre módulos (Auth, Estoque, Vendas, BI, Billing).

Fontes: CSS global do app, referência **Purple Stream** e telas desenhadas no Pencil.

---

## 1. Princípios

- **Números protagonistas.** Métricas grandes, pesadas (700–800) em preto sobre backgrounds neutros. Cor entra para reforçar semântica (verde = bom, vermelho = alerta), não para decorar.
- **Cards com radius alto e sombra sutil.** `border-radius: 16px`, sombra leve para separar sem competir. Zero ruído visual.
- **Roxo é a marca, não o fundo.** Roxo aparece em elementos de identidade (logo, botão primário, tab ativa, item de menu selecionado). Superfícies principais são branco e cinza claro.
- **Sidebar como navegação estável.** Fundo claro, ícones + texto, agrupamentos expansíveis, item ativo em pill lilás.
- **Cálculos em tempo real, alertas visuais imediatos.** Estados críticos (limitador de produção, estoque abaixo do ideal) são comunicados por cor de fundo e ícone, não só por texto.
- **Formulários salvam ao perder foco.** Configurações do produto não têm botão "Salvar". Cada campo salva inline. Botões só existem em ações destrutivas ou irreversíveis.
- **Ícones apenas do Lucide.** Nenhuma outra biblioteca ou emoji.

---

## 2. Tokens

### Cores

**Primárias**
| Token | Hex | Uso |
|---|---|---|
| `$primary` | `#6D28F5` | Marca, botão primário, tab ativa, item selecionado |
| `$primary-soft` | `#EDE9FE` | Fundo de tab ativa, badge de destaque, preview de cálculos, chip de categoria Fabricável |

**Superfícies e texto**
| Token | Hex | Uso |
|---|---|---|
| `$bg-page` | `#F7F7F8` | Fundo da área de conteúdo (não da sidebar/header) |
| `$bg-card` | `#FFFFFF` | Cards, header, sidebar, modais |
| `$bg-muted` | `#F9FAFB` | Fundo de tabela header, campos sufixos/prefixos, blocos de preview neutros |
| `$border` | `#E5E7EB` | Bordas de card, input, botão outline |
| `$border-soft` | `#F3F4F6` | Separadores de linha em tabela |
| `$text-primary` | `#111827` | Texto principal |
| `$text-secondary` | `#6B7280` | Labels, subtítulos, texto de apoio |
| `$text-tertiary` | `#9CA3AF` | Placeholders, hints, separadores decorativos |

**Semânticas — sucesso**
| Token | Hex | Uso |
|---|---|---|
| `$success` | `#166534` | Texto/ícone em badges e estados positivos escuros |
| `$success-soft` | `#DCFCE7` | Fundo de badge de status "Ativo" |
| `$success-vivid` | `#059669` / `#10B981` | Números positivos protagonistas (margem, "estoque permite", "estoque do produto após produção") |

**Semânticas — atenção**
| Token | Hex | Uso |
|---|---|---|
| `$warning` | `#92400E` | Texto de labels em cards de alerta suave |
| `$warning-vivid` | `#B45309` | Valores em destaque em cards de alerta suave (ex: "Máximo Produzível" limitado) |
| `$warning-soft` | `#FEF3C7` | Fundo de badge/card de atenção |

**Semânticas — perigo**
| Token | Hex | Uso |
|---|---|---|
| `$danger` | `#B91C1C` / `#991B1B` | Texto e ícones em alertas de erro |
| `$danger-vivid` | `#DC2626` | Botão destrutivo cheio |
| `$danger-soft` | `#FEE2E2` | Fundo de chip categoria Revenda, ícone de dialog destrutivo |
| `$danger-bg` | `#FEF2F2` | Fundo de linha em vermelho na tabela de receita (estoque insuficiente) |

**Semânticas — info**
| Token | Hex | Uso |
|---|---|---|
| `$info` | `#1E40AF` | Texto de chip categoria Ingrediente, badge Entrada Manual |
| `$info-soft` | `#DBEAFE` | Fundo dos mesmos |

### Tipografia

**Família:** `Manrope`, com fallback `"Segoe UI", system-ui, sans-serif`.

**Pesos usados:** 500, 600, 700, 800, 900.

**Escala**
| Uso | Tamanho | Peso |
|---|---|---|
| Título de página / nome do produto | 24 | 700 |
| Título de card / seção | 18 | 700 |
| Título de modal | 20 | 800 |
| Valor de métrica grande | 22–34 | 700–800 |
| Corpo padrão | 14 | 400–700 |
| Label de campo / subtítulo | 13 | 600 (label) / 400 (subtítulo) |
| Header de tabela (uppercase) | 11 | 600, letter-spacing 0.5 |
| Hint / caption / breadcrumb | 12–13 | 500 |

Logo "Scoops" é itálico, peso 900, cor `$primary`.

Tagline abaixo do logo em uppercase, peso 800, letter-spacing 1.2–1.5, cor `$text-secondary`.

### Radius

| Token | Valor | Uso |
|---|---|---|
| `$radius-sm` | 6px | Botões pequenos em tabela (Editar, Remover, paginação) |
| `$radius-md` | 8–10px | Botões primários/outline, tabs em pill, inputs, badges de tab |
| `$radius-lg` | 12px | Cards de tabela interna, inputs de preview, badges de alerta |
| `$radius-xl` | 16px | Cards principais, modais |
| `$radius-full` | 999px | Chips, badges arredondados, switch, ícones circulares |

### Sombras

| Uso | Valor |
|---|---|
| Card principal | `0 1px 3px rgba(0,0,0,0.05)` |
| Card de tab ativa | `0 1px 2px rgba(0,0,0,0.06)` |
| Botão primário | `0 8px 20px rgba(109, 40, 217, 0.25)` |
| Botão destrutivo | `0 8px 20px rgba(220, 38, 38, 0.25)` |
| Modal / dialog | `0 20px 50px rgba(0,0,0,0.20)` |

### Espaçamento

Escala de gap/padding: 4, 6, 8, 12, 14, 16, 20, 24, 32.

- Interior de card principal: 24.
- Gap entre seções empilhadas: 20.
- Padding lateral do conteúdo (dentro da Content area): 32.
- Padding vertical de linha de tabela: 12–14.

---

## 3. Componentes

### Sidebar

**Estrutura:**
- Frame vertical, largura 280px, altura fill, `$bg-card`, borda direita `$border`.
- Padding 20px lateral, 28 top, 24 bottom, gap 28 entre seções.

**Brand no topo:**
- Mark quadrado 40×40, `$primary`, radius 10, ícone `ice-cream-cone` branco 22px.
- Texto "Scoops" ao lado (20/900, itálico, `$primary`) + tagline abaixo (9/800 uppercase, `$text-secondary`).

**Nav item padrão:**
- Frame horizontal, padding 10×14, gap 12, radius 10.
- Ícone Lucide 18×18 + texto 14/800 `$text-primary`.

**Nav item selecionado:**
- Fundo `$primary-soft`, ícone e texto em `$primary` (peso 900 no texto).
- Se for grupo expansível: chevron à direita, tamanho 16.

**Grupo expansível:**
- Header (item padrão) + Subnav quando aberto.
- Subnav com padding-left 26 e ponto (ellipse 6×6) antes de cada item filho.
- Filho ativo: ponto e texto em `$primary`. Filho inativo: `$text-tertiary` / `$text-secondary`.

**Footer:**
- Separador `border-top 1px $border-soft`.
- Items Usuários e Assinatura (mesmo padrão dos nav items).

### Header

**Estrutura:**
- Frame horizontal, altura 72, padding 16 top/bottom + 24 lateral.
- `$bg-card` com borda inferior 1px `$border`.

**Search bar (esquerda):**
- Frame horizontal, width ~320, padding 10×16, `$bg-card`, borda 1px `$border`, radius 12.
- Ícone `search` 16px + placeholder 14/500 `$text-tertiary`.

**User card (direita):**
- Frame horizontal, padding 8×14×8×8, gap 10, `$bg-card`, borda 1px `$border`, radius 12.
- Avatar circular 32×32 (fundo `$success-soft`, texto `$success` 13/900).
- Nome 14/800 + ícone `chevron-down` 14px cinza.

### Cards principais

**Estrutura padrão:**
- `$bg-card`, radius 16, padding 24, gap 16–20 entre seções internas.
- Sombra sutil (ver tokens).

**Header do card:**
- Título 18/700 + contador em cinza (14/500) quando aplicável.
- Subtítulo 13/400 `$text-secondary`.
- Botão principal (ex: "Vincular Marca") alinhado à direita.

### Métricas em cards

Três variações:

**Neutra**
- Fundo `$bg-muted`, padding 20, radius 16.
- Label 11/600 uppercase `$text-secondary`, letter-spacing 0.5.
- Valor 22–34/800 `$text-primary`.
- Detalhe opcional 12/500 `$text-secondary` abaixo.

**Positiva (sucesso)**
- Fundo `$bg-muted`, mesmo layout.
- Valor em `$success-vivid`.

**Atenção (limitador)**
- Fundo `$warning-soft`, label em `$warning`, valor em `$warning-vivid`, detalhe em `$warning` 600.

### Botão primário

**Padrão:**
- Padding 8×14, `$primary`, radius 10, gap 6, alignItems center.
- Ícone opcional 14×14 branco à esquerda.
- Texto 13/700 branco.
- Sombra roxa translúcida (ver tokens).

**Uso:** ações principais (Vincular Marca, Adicionar Ingrediente, Confirmar Produção, Salvar alterações, Entendi em dialogs de bloqueio).

### Botão outline

- Padding 10×20, `$bg-card`, borda 1px `$border`, radius 10.
- Texto 13/700 `$text-primary`.
- **Uso:** Cancelar em modais.

### Botão destrutivo

**Cheio (ação irreversível):**
- Padding 10×20, `$danger-vivid`, radius 10, ícone `trash-2` branco 14px + texto 13/700 branco.
- Sombra vermelha translúcida.
- **Uso:** botão "Remover produto" na Zona de Perigo, botão final em dialogs de confirmação de deleção.

**Outline (secundário):**
- `$bg-card`, borda 1px `#FCA5A5`, texto `$danger` 13/700, ícone `trash-2` 14px.
- **Uso:** "Remover ingrediente" no footer esquerdo do modal de edição, "Remover" nas tabelas.

### Tabs em pill

**Container:**
- Frame horizontal, padding 4, gap 4, fundo cinza claro (`#F1F5F9`), radius 12.

**Tab inativa:**
- Padding 8×16, gap 8, radius default.
- Ícone Lucide 15×15 `$text-secondary` + label 14/600 `$text-secondary`.

**Tab ativa:**
- Fundo `$bg-card`, radius 8, sombra sutil.
- Ícone e label em `$primary` (label 14/700).

### Chips de categoria

- Padding 4×10, radius 999, borda 1px na cor de destaque + fundo soft correspondente.
- Texto 12/600.

Mapeamento por categoria:
| Categoria | Fundo | Texto/Borda |
|---|---|---|
| Ingrediente | `$info-soft` | `$info` / `#93C5FD` |
| Fabricável | `$primary-soft` | `$primary` / `#C4B5FD` |
| Acompanhamento | `$warning-soft` | `$warning` / `#FCD34D` |
| Revenda | `$danger-soft` | `$danger` / `#FCA5A5` |

Chip de status "Ativo": mesmo padrão em `$success-soft` / `$success` / `#86EFAC`.

### Badge de tipo (em tabela de movimentações)

Padrão de chip, ligeiramente maior. Mapeamento:
| Tipo | Fundo | Texto |
|---|---|---|
| Entrada Manual | `$info-soft` | `$info` |
| Produção | `$primary-soft` | `#5B21B6` |
| Venda | `$warning-soft` | `$warning` |
| Baixa Manual | `$danger-soft` | `$danger` |

### Input de texto padrão

- Frame horizontal, `$bg-card`, borda 1px `$border`, radius 10.
- Padding interno 12×14.
- Texto 14/700 `$text-primary`.

### Input com prefix/suffix

- Prefix/Suffix: padding 12×14, fundo `$bg-muted`, borda vertical de separação `$border`, radius só nos cantos externos.
- Texto do prefix/suffix: 14/800 `$text-secondary`.
- Usado para R$, kg, ml, un, g.

### Dropdown (select)

- Mesma base do input.
- Valor + ícone `chevron-down` 14 `$text-secondary` alinhado à direita.
- Quando desabilitado (ex: campo bloqueado em Editar): fundo `$bg-muted`, ícone `lock` 14 `$text-tertiary` à esquerda do valor, texto em `$text-secondary`.

### Textarea

- Base do input, mas layout vertical, padding 14, altura fixa (ex: 104px).
- Texto interno 14/500.

### Switch

- Frame 44×24, radius 999.
- Estado ligado: fundo `$success-vivid`, dot branco 18×18 alinhado à direita.
- Estado desligado: fundo `$border`, dot alinhado à esquerda.

### Switch como "campo"

- Row horizontal, padding 12×14, gap 12, `$bg-card`, borda 1px `$border`, radius 10.
- Switch à esquerda + label 14/700 `$text-primary` à direita.
- Usado para Status "Produto ativo" e "Permitir estoque negativo".

### Tabela

**Header:**
- Frame horizontal, fundo `$bg-muted`, padding 12×16–20.
- Cada célula com texto 11/600 uppercase `$text-secondary`, letter-spacing 0.5.

**Linha:**
- Padding 14×16–20, alignItems center.
- Separador `border-top 1px $border-soft` a partir da segunda linha.

**Linha em alerta (ex: ingrediente insuficiente):**
- Fundo `$danger-bg`.
- Ícone `triangle-alert` 14 `$danger` + texto de valor em `$danger`.
- Subtexto (ex: "Só 4.000 ml — limita a produção") em `$danger` 11/500.

**Container da tabela:**
- Borda 1px `$border-soft`, radius 12, clip.

### Ações em linha (tabela)

Botões pequenos, padding 6×10, gap 4, radius 6, borda 1px.

- **Entrada:** borda + ícone `arrow-down` + texto verde (`#10B981`).
- **Baixa:** borda + ícone `arrow-up` + texto laranja (`#F59E0B`).
- **Editar:** borda `$border`, ícone `pencil` + texto `$text-secondary`.
- **Remover:** borda `#FCA5A5`, ícone `trash-2` + texto `$danger`.
- **Mais:** ícone `ellipsis` sozinho, mesmo padrão de outline.

Todos texto 12/600.

### Paginação

- Frame horizontal, justify space-between.
- Info à esquerda: "Mostrando 1-5 de 47" (13/400 `$text-secondary`).
- Botões de página à direita, 32×32, radius 6, texto 13/500.
- Botão ativo: `$primary`, texto branco 13/700, sombra roxa translúcida.

### Modal

**Container:**
- `$bg-card`, radius 16, sombra grande (ver tokens).
- Larguras típicas: 440 (dialog simples), 520 (formulário padrão), 640 (produção com projeção).

**Header:**
- Padding 24 top + 24 lateral, sem padding bottom.
- Ícone quadrado 44×44 (fundo `$warning-soft`, `$danger-soft` ou `$success-soft`) com ícone Lucide central 20–22px.
- Título 18–20/800 + subtítulo 13/400 `$text-secondary`.
- Botão close 32×32 outline com ícone `x` 16 `$text-secondary`.

**Body:**
- Padding 20 top + 24 lateral, gap 16.
- Campos de formulário (labels 13/600 + inputs).
- Bloco de preview em `$bg-muted` com borda `$border-soft`, radius 12: 3 métricas lado a lado justify-space-between.

**Footer:**
- Padding 16 top + 24 lateral + 24 bottom, gap 12.
- Alinhamento `justify-end` (padrão) ou `justify-space-between` (quando há botão de remover à esquerda).
- Cancelar (outline) + CTA primário à direita.

### Dialog de bloqueio

Variação do modal usada para bloquear ações destrutivas quando há dependências.

- Ícone `triangle-alert` `$warning` em quadrado `$warning-soft`.
- Título "Categoria X em uso" + subtítulo explicativo.
- Lista de dependências em bloco `$bg-muted`, cada item com ícone `link` 14 + texto 13/600.
- CTA único: "Entendi" (primary).

### Dialog de confirmação destrutiva

- Ícone `triangle-alert` ou `trash-2` `$danger` em quadrado `$danger-soft`.
- Título "Remover X?" + subtítulo "Esta ação não pode ser desfeita."
- Corpo com descrição do impacto e (opcional) lista de itens em bloco `$bg-muted`.
- Footer: Cancelar (outline) + botão destrutivo cheio.

### Preview de cálculo (bloco de métricas)

Aparece em modais de Adicionar/Editar Ingrediente, Adicionar Tamanho, Registrar Produção.

- Frame horizontal, padding 16×20, `$bg-muted`, borda `$border-soft`, radius 12.
- Justify space-between.
- Cada métrica: label 11/700 `$text-secondary` uppercase (letter-spacing 0.4) + valor 18/800 `$text-primary` (ou `$success-vivid` para valores positivos).

### Card de categoria (aba Configurações)

- Frame horizontal, padding 14×16, gap 10, radius 12.
- **Estado ativo:** fundo da cor soft da categoria + borda 2px da cor sólida + ícone e label na cor sólida.
- **Check circular** à direita, 20×20, radius 999, fundo cor sólida com ícone `check` branco 12px.
- **Estado inativo:** `$bg-card`, borda 1px `$border`, ícone `$text-secondary`, label `$text-primary`.

### Zona de Perigo

- Card com `$bg-danger-bg` (`#FEF2F2`) + borda 1px `#FCA5A5` + radius 16 + padding 24.
- Título 18/700 `$danger` + subtítulo 13/400 `$danger`.
- Botão destrutivo cheio à direita.

---

## 4. Padrões de tela

### Layout base

- **Sidebar** fixa à esquerda (280px).
- **Content** ocupa o resto:
  - Header (72px) no topo.
  - ContentWrap com padding 8 top + 32 lateral + 32 bottom + gap 20 entre elementos.

### Página do Produto

Ordem vertical do ContentWrap:
1. Breadcrumb ("Estoque › Produtos › [Nome do Produto]")
2. Product Header (card com nome, unidade, status, chips de categoria, botões Editar/Remover)
3. Tabs em pill (condicionais por categoria)
4. Cards de conteúdo da aba ativa

### Tabelas dentro de cards

- Título do card + contador + botão principal no topo.
- Tabela abaixo.
- Filtros (quando aplicável) entre header e tabela.
- Paginação (quando aplicável) no rodapé do card.

### Estados vazios

Botão grande centralizado com CTA explícito (ex: "Adicionar primeira marca") quando a lista está vazia.

### Estados de alerta

- **Preditivo (produção):** linha em vermelho + ícone + subtexto explicativo. Botão de confirmação bloqueado.
- **Informativo (limitador):** card de métrica com fundo warning + valor destacado + detalhe explicativo.

---

## 5. Ícones

**Biblioteca única:** [Lucide](https://lucide.dev). Nada de emojis ou outras libs.

**Ícones frequentes:**
| Ícone | Uso |
|---|---|
| `house` | Dashboard |
| `package` | Estoque, Fabricável (chip categoria) |
| `tag` | Vendas, Preços (tab), Revenda (chip) |
| `chef-hat` | Receita (tab) |
| `layers` | Acompanhamentos (tab) |
| `factory` | Fabricável (card categoria) |
| `settings` | Configurações |
| `users` | Usuários |
| `credit-card` | Assinatura |
| `search` | Busca |
| `bell` / `circle-help` | Header (notificações, ajuda) |
| `chevron-down` / `chevron-right` | Dropdowns, grupos expansíveis |
| `plus` / `minus` | Adicionar / stepper |
| `pencil` | Editar |
| `trash-2` | Remover |
| `arrow-down` / `arrow-up` | Entrada / Baixa |
| `arrow-right` | Projeção (X → Y) |
| `triangle-alert` | Alertas críticos |
| `info` | Notas informativas |
| `link` | Item de dependência em dialog de bloqueio |
| `check` | Confirmação em check circular |
| `lock` | Campo desabilitado |
| `x` | Fechar, remover chip |
| `play` | Botão Produzir |
| `calculator` | Preview de cálculo |
| `ellipsis` | Menu de mais ações |
| `ice-cream-cone` | Mark da marca |

---

## 6. Comportamento e microinterações

- **Cálculos em tempo real:** ao digitar em qualquer input que alimenta um cálculo (quantidade de ingrediente, preço, tamanho, lotes a produzir), o preview e as métricas se atualizam imediatamente.
- **Sincronização de inputs (Modal Produzir):** stepper de lotes ↔ input de unidade em ml (ou unidade do produto). Editar um atualiza o outro.
- **Baixas atômicas:** ao confirmar produção ou venda, todas as baixas de estoque acontecem juntas. Se qualquer uma falha, nenhuma é aplicada.
- **Bloqueio duro em categorias:** se o gerente tenta desmarcar categoria em uso, sistema exibe dialog listando as dependências, sem permitir a remoção.
- **Salvamento inline (Configurações):** cada campo salva ao perder foco. Sem botão "Salvar".
- **Toggle de disponibilidade (Revenda):** marca desabilitada não aparece no PDV. Input de preço fica em cinza tertiary.
- **Confirmação destrutiva:** qualquer remoção (produto, marca, ingrediente, acompanhamento, tamanho) passa por dialog.

---

## 7. Fora do padrão (não usar)

- Formas circulares para itens não-icônicos (avatares, dots de subnav são exceções).
- Emojis em qualquer contexto.
- Ícones fora do Lucide.
- Bordas grossas (> 2px) em qualquer elemento.
- Gradientes complexos (só sombras coloridas suaves nos botões primários e destrutivos).
- Fundo saturado em blocos de preview de cálculo (foi movido para `$bg-muted` neutro).
- Cor "Base" como tipo de acompanhamento (o fabricável já é a base do pedido).
- Duas fontes diferentes (só Manrope).
- Cores por tipo na coluna Tipo da tabela de acompanhamentos vinculados (fica texto neutro).
- Roxo em número de valor override na tabela de acompanhamento (fica igual aos outros — todos em `$text-primary`).