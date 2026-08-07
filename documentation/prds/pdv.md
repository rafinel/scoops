### 1. Visão Geral

O módulo de **Vendas do Scoops** permite que operadores de sorveterias e
açaiterias montem e registrem pedidos com produtos vendidos como Porção ou
Revenda. O módulo possui quatro entradas independentes na navegação:
`Nova venda`, `Pedidos`, `Canais de venda` e `Descontos`.

Em `Nova venda`, o operador encontra produtos elegíveis, configura tamanho,
marca, acompanhamentos e quantidade, revisa o carrinho e registra o pedido.
O registro cria uma venda definitiva e executa todas as baixas de estoque em
uma única transação.

Em `Canais de venda`, o gerente configura ajustes percentuais opcionais usados
para representar contextos como delivery, balcão ou promoção local. Um pedido
sem canal utiliza os preços-base dos produtos. Um pedido com canal aplica o
mesmo percentual a todos os produtos e acompanhamentos pagos.

Em `Descontos`, o gerente configura Combos formados por pelo menos dois
produtos distintos e vendidos por um preço final fixo. Durante a montagem do
pedido, o sistema detecta automaticamente os Combos elegíveis, preserva os
produtos em linhas separadas e aplica a combinação que gera a maior economia,
sem reutilizar a mesma unidade em mais de um Combo.

Em `Pedidos`, usuários autorizados consultam as vendas da sorveteria e os
snapshots comerciais preservados no momento do registro.

**Objetivo:** permitir que um operador treinado monte e registre um pedido
comum em até 60 segundos, sem cálculo manual de preços, baixa parcial de estoque
ou duplicidade de venda.

**Problema resolvido:** sorveterias precisam combinar tamanhos, quantidades,
acompanhamentos e embalagens enquanto mantêm preços e saldos consistentes. Sem
um fluxo centralizado, o atendimento fica sujeito a cálculos incorretos,
estoque divergente, descontos inconsistentes e histórico incompleto.

**Valor entregue:** atendimento rápido, precificação previsível por canal,
consumo preciso de estoque, aplicação automática de Combos e histórico legível
mesmo quando produtos, marcas, tamanhos, acompanhamentos, canais ou descontos
forem alterados ou excluídos.

---

### 2. Público-alvo

#### Público principal

Operadores de sorveterias e açaiterias independentes, de pequeno ou médio porte,
que precisam montar e registrar pedidos durante o atendimento.

#### Públicos secundários

- Gerentes responsáveis pela configuração dos canais de venda e descontos.
- Gerentes e operadores que precisam conferir pedidos registrados pela equipe.

#### Não público

- Redes e franquias que dependem de gestão multiloja avançada.
- Restaurantes que precisam de mesas, comandas, cozinha ou divisão de conta.
- Operações que exigem caixa, pagamento, emissão fiscal ou funcionamento
  offline no primeiro lançamento.

#### Contexto de uso

- Atendimento em computador ou tablet em modo paisagem.
- Uso simultâneo por mais de um operador na mesma sorveteria.
- Pedidos presenciais ou recebidos externamente e digitados manualmente.
- Operação conectada ao servidor, com validação de estoque em tempo real.

#### Dores e necessidades

- Encontrar rapidamente um produto disponível.
- Montar Porções com tamanho, acompanhamentos e quantidade.
- Registrar Revendas pelo produto e pela marca correta, quando aplicável.
- Aplicar automaticamente a melhor combinação de Combos elegíveis.
- Aplicar preços diferentes por contexto comercial sem duplicar produtos.
- Evitar estoque negativo e baixas parciais.
- Consultar quem registrou uma venda, quando e por qual valor.

#### Jobs to Be Done

- Quando estiver atendendo um cliente, quero encontrar e configurar os produtos
  rapidamente, para registrar o pedido sem interromper o atendimento.
- Quando uma venda pertencer a um canal com preço diferente, quero selecionar
  esse canal, para que todos os valores sejam recalculados automaticamente.
- Quando houver dois operadores vendendo simultaneamente, quero que o estoque
  seja revalidado no registro, para evitar saldo negativo ou vendas
  inconsistentes.
- Quando precisar conferir uma venda anterior, quero abrir seu detalhamento,
  para visualizar os dados praticados no momento do pedido.
- Quando um canal deixar de existir, quero poder excluí-lo sem perder o contexto
  dos pedidos anteriores.
- Quando eu configurar uma oferta com produtos diferentes, quero definir um
  preço fixo de Combo, para promovê-la sem alterar o cadastro dos produtos.
- Quando um pedido atender a mais de uma oferta, quero que o sistema escolha
  automaticamente a maior economia, para não depender de cálculo do operador.

---

### 3. Análise do Cenário Competitivo

O mercado brasileiro possui soluções amplas para alimentação e soluções
generalistas de ponto de venda. Segundo suas páginas oficiais, os concorrentes
costumam combinar PDV, estoque, caixa, financeiro, delivery e emissão fiscal.
O Scoops não tentará reproduzir essa amplitude no MVP.

A oportunidade de diferenciação está na operação especializada de sorveterias:
Porções vendidas por tamanho, acompanhamentos com consumo configurado,
Revendas por produto e marca e baixa precisa da quantidade efetivamente
consumida.

#### Matriz competitiva

| Solução | Público | Proposta de valor | Funcionalidades | Preço público | Limitações |
|---|---|---|---|---|---|
| [Consumer](https://consumer.com.br/recursos) | Restaurantes, bares, lanchonetes, cafeterias, sorveterias e outros negócios de alimentação | Plataforma única para operação de restaurantes | PDV, estoque, ficha técnica, caixa, delivery, fiscal, cardápio digital e integrações | A página oficial de planos informa opções a partir de [R$ 59,90/mês](https://loja.consumer.com.br/) | Não identificado publicamente |
| [Saipos](https://saipos.com/sistema/sorveteria) | Sorveterias e outros estabelecimentos de alimentação | Centralizar gestão, operação, estoque e delivery | Integração com balança, estoque, financeiro, delivery e análise de vendas | A página oficial informa planos a partir de R$ 219,90/mês | Não identificado publicamente |
| [Kyte](https://www.kyte.com.br/vender/site-de-pedidos) | Pequenos negócios de varejo e serviços | Vender pelo celular, computador e catálogo online | PDV, catálogo, estoque, recibos, fiado e fluxo de caixa | PRO por R$ 49,90/mês; GROW por R$ 69,90/mês; PRIME por R$ 99,90/mês | Inferência baseada na abrangência oficial: solução generalista, sem especialização pública identificada em consumo por tamanho e acompanhamento |
| [MarketUP](https://suporte.marketup.com/hc/pt-br/articles/360000798983-Aplicativos-MarketUP) | Pequenas empresas, incluindo bares e restaurantes | ERP e PDV sem mensalidade | Cadastro de produtos, vendas, caixa, modo offline, ERP e NFC-e | Gratuito, segundo a página oficial | Inferência baseada na página oficial: foco generalista, sem regras públicas identificadas para montagem especializada de Porções |
| [iFood](https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/definitions) | Estabelecimentos que vendem por marketplace e cardápio digital | Distribuição e gestão de ofertas em canais digitais | Catálogos, produtos, complementos, disponibilidade e preços distintos por contexto | Não identificado publicamente nesta fonte | Não substitui o controle operacional interno do Scoops; integração está fora do MVP |
| Planilha, calculadora e registro manual | Pequenas operações sem sistema integrado | Baixo custo inicial e flexibilidade | Cálculo e anotação manual | Variável | Risco de erro de preço, estoque divergente, duplicidade e histórico incompleto |

#### Constatações e inferências

- A página oficial do Consumer informa que sua plataforma reúne mais de cem
  funcionalidades e atende também sorveterias.
- A página oficial da Saipos para sorveterias destaca integração com balança,
  estoque e análise por canal.
- A documentação oficial do iFood permite preços diferentes para o mesmo item
  nos contextos `Entrega` e `Cardápio Digital`.
- A documentação oficial do iFood descreve
  [Combos como itens estruturados](https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/guides/combo)
  com grupos e opções; no Scoops, a decisão confirmada é manter os produtos
  como linhas comuns e aplicar o Combo como desconto automático do pedido.
- Inferência baseada nas fontes: preços específicos por produto e canal são um
  modelo mais flexível adotado por soluções maduras.
- Decisão confirmada para o Scoops: o MVP utilizará um percentual global por
  canal, sem exceções por produto, reduzindo configuração e complexidade.

#### Diferenciais recomendados

- Montagem rápida orientada ao atendimento de sorveterias.
- Baixa de estoque baseada no tamanho, quantidade e acompanhamentos vendidos.
- Revenda por produto e marca explícita quando aplicável.
- Combos configuráveis com preço fixo e aplicação automática da maior economia.
- Validação atômica em cenários com operadores simultâneos.
- Preço opcional por canal sem duplicar o cadastro dos produtos.
- Snapshots completos para preservar o histórico após alterações cadastrais.

---

### 4. Requisitos

#### REQ-01 Gestão de Canais de Venda

- [ ] **Gestão de Canais de Venda**

**Descrição:** O gerente deve conseguir criar e administrar canais opcionais que
aplicam um percentual global aos itens pagos de um pedido.

##### Regras de Negócio

- **Campos:** cada canal possui nome, percentual e status.
- **Nome obrigatório:** o nome não pode ser vazio ou composto apenas por
  espaços.
- **Nome único:** não podem existir canais com o mesmo nome na sorveteria,
  ignorando maiúsculas, minúsculas e espaços nas extremidades.
- **Percentual:** aceita valores entre `−99,99%` e `+100%`, inclusive.
- **Acréscimo:** percentual positivo aumenta os preços.
- **Desconto:** percentual negativo reduz os preços.
- **Neutro:** percentual zero identifica o canal sem alterar os preços.
- **Canal opcional:** pedidos podem ser registrados sem canal.
- **Sem canal padrão:** nenhum canal é selecionado automaticamente.
- **Status ativo:** somente canais ativos podem ser selecionados em novas
  vendas.
- **Inativação:** impede novas seleções, mas não altera pedidos anteriores.
- **Exclusão:** qualquer canal pode ser excluído após confirmação, mesmo quando
  já utilizado.
- **Snapshot:** edição, inativação ou exclusão não modifica os dados copiados
  para pedidos anteriores.
- **Multi-tenancy:** canais são exclusivos da sorveteria atual.
- **Dependência:** permissões de gerenciamento dependem do módulo de Auth.

##### Regras de UI/UX

- **Listagem:** deve exibir nome, percentual, tipo do ajuste, status e ações.
- **Novo canal:** deve solicitar nome, percentual e status.
- **Representação:** acréscimos usam sinal `+`, descontos usam `−` e percentuais
  neutros usam `0%`.
- **Validação inline:** nomes duplicados e percentuais fora do intervalo devem
  ser informados junto ao campo.
- **Estado vazio:** deve explicar que canais são opcionais e oferecer
  `Criar primeiro canal`.
- **Exclusão:** deve apresentar confirmação informando que pedidos anteriores
  continuarão preservados.
- **Feedback:** criação, edição, inativação e exclusão devem apresentar sucesso,
  erro e carregamento.
- **Ação bloqueada:** um Operador sem permissão não deve visualizar ações de
  gerenciamento.
- **Responsividade:** tabela e formulário não podem cortar nomes, percentuais ou
  ações em telas menores.
- **Acessibilidade:** campos devem possuir rótulos associados e erros anunciados
  por tecnologia assistiva.

---

#### REQ-02 Catálogo de Produtos da Nova Venda

- [ ] **Catálogo de Produtos da Nova Venda**

**Descrição:** A tela `Nova venda` deve apresentar somente produtos ativos e
com configuração comercial válida, diferenciando disponibilidade e categoria
de venda.

##### Regras de Negócio

- **Fonte dos dados:** produtos, tamanhos, marcas, acompanhamentos, preços-base e
  quantidades consumidas são configurados no módulo de Produtos.
- **Sem edição comercial:** a tela `Nova venda` não permite alterar cadastro,
  preço ou estoque.
- **Categoria Porção:** aparece quando possui pelo menos um tamanho ativo e
  válido.
- **Categoria Revenda:** aparece quando possui preço e disponibilidade válidos.
- **Categoria Fabricável:** não torna um produto vendável sem Porção ou Revenda.
- **Categoria Ingrediente:** não torna um produto vendável.
- **Porção e Revenda:** permanecem mutuamente exclusivas.
- **Produto inativo:** não aparece em operações novas.
- **Produto incompleto:** não aparece no catálogo e deve ser corrigido no módulo
  de Produtos.
- **Produto sem estoque:** permanece visível como indisponível.
- **Porção parcial:** permanece selecionável quando ao menos um tamanho puder
  ser vendido.
- **Configuração indisponível:** tamanho, marca ou acompanhamento inviável fica
  desabilitado.
- **Estoque não reservado:** visualizar ou adicionar um produto ao carrinho não
  reserva saldo.
- **Inclusão única:** um produto que já esteja no carrinho não pode ser
  adicionado novamente, mesmo que o operador pretenda escolher outro tamanho,
  marca ou conjunto de acompanhamentos.
- **Multi-tenancy:** somente produtos da sorveteria atual podem ser exibidos.

##### Regras de UI/UX

- **Grade:** produtos devem ser apresentados em cards de seleção rápida.
- **Busca:** deve filtrar por nome.
- **Filtros:** deve oferecer `Todos`, `Porções` e `Revendas`.
- **Identificação:** o card deve exibir nome, categoria comercial e
  disponibilidade.
- **Sem estoque:** o card deve permanecer visível, desabilitado e identificado
  com `Sem estoque`.
- **Produto adicionado:** o card de um produto presente no carrinho deve exibir
  o selo `Adicionado`, permanecer visualmente distinto e não pode abrir uma nova
  configuração.
- **Indisponibilidade parcial:** opções indisponíveis devem informar o motivo.
- **Estado vazio inicial:** deve orientar o cadastro de produtos quando não
  houver nenhum produto elegível.
- **Estado vazio de busca:** deve exibir `Nenhum produto encontrado` e permitir
  limpar busca e filtros.
- **Loading:** a grade deve usar skeletons ou indicador equivalente.
- **Ação bloqueada:** cards indisponíveis ou já adicionados não podem abrir a
  configuração do item; para um produto adicionado, a interface deve orientar o
  ajuste de configuração ou quantidade diretamente no carrinho.
- **Responsividade:** a quantidade de colunas deve adaptar-se à largura
  disponível.
- **Acessibilidade:** cards devem ser operáveis por teclado e comunicar os
  estados disponível, indisponível ou adicionado.

---

#### REQ-03 Configuração de Item Porção

- [ ] **Configuração de Item Porção**

**Descrição:** O operador deve conseguir selecionar tamanho, acompanhamentos e
quantidade antes de adicionar uma Porção ao carrinho.

##### Regras de Negócio

- **Tamanho obrigatório:** toda Porção exige um tamanho ativo.
- **Quantidade obrigatória:** deve ser um número inteiro maior que zero.
- **Acompanhamentos:** são opcionais e podem ser múltiplos.
- **Preço contextual:** o preço-base do acompanhamento depende da configuração
  `produto + tamanho + acompanhamento`.
- **Acompanhamento gratuito:** mantém preço igual a zero em qualquer canal.
- **Consumo da Porção:** corresponde a
  `quantidade_do_tamanho × quantidade_vendida`.
- **Consumo do acompanhamento:** corresponde a
  `quantidade_por_porção × quantidade_vendida`.
- **Estoque único:** a baixa usa o saldo do produto.
- **Estoque por marca:** a baixa automática usa a marca principal vigente.
- **Marca principal inválida:** a configuração fica indisponível.
- **Mudança de tamanho:** deve atualizar preço, consumo e acompanhamentos
  disponíveis.
- **Dependência:** regras de tamanhos e acompanhamentos pertencem ao módulo de
  Produtos.

##### Regras de UI/UX

- **Fluxo único:** tamanho, acompanhamentos e quantidade devem ficar na mesma
  área de configuração.
- **Tamanhos:** devem exibir nome, quantidade consumida e preço-base.
- **Acompanhamentos:** devem exibir nome, tipo e preço-base ou `Grátis`.
- **Quantidade:** deve possuir controles adequados para toque e entrada direta.
- **Resumo:** deve mostrar preço unitário final, quantidade e subtotal antes da
  inclusão.
- **Indisponibilidade:** opções sem saldo suficiente devem ficar desabilitadas
  com explicação.
- **Erro:** tentativa de incluir configuração inválida deve preservar as escolhas
  já realizadas.
- **Ação bloqueada:** `Adicionar ao carrinho` fica desabilitado sem tamanho ou
  quantidade válidos.
- **Responsividade:** a configuração não pode ocultar a ação principal.
- **Acessibilidade:** opções selecionáveis devem comunicar nome, estado e preço.

---

#### REQ-04 Configuração de Item Revenda

- [ ] **Configuração de Item Revenda**

**Descrição:** O operador deve conseguir selecionar a marca, quando aplicável,
e a quantidade de unidades de uma Revenda antes de adicioná-la ao carrinho.

##### Regras de Negócio

- **Sem tamanho:** Revenda não utiliza tamanhos de Porção.
- **Sem acompanhamento:** Revenda não aceita acompanhamentos.
- **Quantidade:** deve ser um número inteiro maior que zero.
- **Estoque único:** quando o produto não controlar estoque por marca, a baixa
  corresponde a `1 unidade × quantidade_vendida`.
- **Estoque por marca:** o operador seleciona uma marca de Revenda disponível.
- **Marca explícita:** a baixa ocorre na marca selecionada, independentemente da
  marca principal.
- **Preço:** usa o preço-base da configuração de Revenda ou da marca.
- **Indisponibilidade:** configurações inativas ou sem saldo suficiente não
  podem ser selecionadas.
- **Dependência:** produto, marca, preço e disponibilidade são configurados no
  módulo de Produtos.

##### Regras de UI/UX

- **Seleção:** deve exibir produto, marca quando aplicável, preço-base e
  disponibilidade.
- **Quantidade:** deve possuir controles adequados para toque e entrada direta.
- **Resumo:** deve mostrar preço unitário final, quantidade e subtotal.
- **Sem estoque:** marca ou configuração indisponível deve ficar desabilitada.
- **Erro:** validações devem preservar a quantidade informada.
- **Ação bloqueada:** `Adicionar ao carrinho` fica desabilitado sem marca
  obrigatória ou quantidade válida.
- **Responsividade:** opções e resumo não podem sobrepor-se em telas menores.
- **Acessibilidade:** cada opção deve comunicar produto, marca, preço e estado.

---

#### REQ-05 Montagem e Edição do Carrinho

- [ ] **Montagem e Edição do Carrinho**

**Descrição:** O operador deve conseguir revisar, editar e remover itens antes
de registrar o pedido.

##### Regras de Negócio

- **Carrinho temporário:** o carrinho não é um pedido persistido.
- **Sem rascunhos:** sair ou recarregar a tela pode descartar o carrinho após
  aviso.
- **Canal opcional:** o carrinho pode ser montado com ou sem canal.
- **Preço inicial:** sem canal selecionado, usa preços-base.
- **Edição direta:** tamanho, marca, acompanhamentos e quantidade podem ser
  alterados a partir do item.
- **Revalidação na edição:** qualquer alteração recalcula preço e consumo.
- **Unicidade por produto:** cada produto pode ocupar no máximo uma linha no
  carrinho, independentemente de tamanho, marca ou acompanhamentos.
- **Nova inclusão bloqueada:** tentar adicionar um produto já presente no
  carrinho não cria linha, não soma quantidade e não altera a configuração
  existente.
- **Quantidade no carrinho:** novas unidades de um produto já adicionado devem
  ser informadas pelos controles de quantidade da linha existente.
- **Produto imutável na edição:** a edição de uma linha pode alterar tamanho,
  marca, acompanhamentos e quantidade, mas não pode substituir o produto por
  outro.
- **Remoção:** retirar um item recalcula o total imediatamente.
- **Carrinho vazio:** não pode ser registrado.
- **Estoque não reservado:** itens no carrinho não bloqueiam saldo.
- **Movimentação:** nenhuma baixa ocorre antes do registro definitivo.

##### Regras de UI/UX

- **Estrutura desktop:** catálogo e carrinho devem permanecer visíveis lado a
  lado.
- **Item:** deve exibir produto, tamanho, marca, acompanhamentos, quantidade,
  preço unitário e subtotal conforme aplicável.
- **Ações:** cada item deve oferecer editar e remover.
- **Quantidade:** cada linha deve permitir aumentar, reduzir ou informar
  diretamente a quantidade do produto.
- **Correspondência com o catálogo:** enquanto uma linha existir, o card do
  produto correspondente deve permanecer identificado com `Adicionado` e
  bloqueado para nova seleção; removê-la deve reabilitar o card.
- **Total:** deve permanecer destacado.
- **Canal:** seleção opcional deve permanecer visível durante a montagem.
- **Estado vazio:** deve exibir `Adicione produtos para iniciar a venda`.
- **Saída:** deve avisar que itens não registrados serão perdidos.
- **Feedback:** edições, remoções e recálculos devem atualizar a interface
  imediatamente.
- **Tentativa duplicada:** se uma inclusão for solicitada a partir de uma visão
  desatualizada, deve exibir `Produto já adicionado. Ajuste-o no carrinho` sem
  modificar o carrinho.
- **Ação bloqueada:** `Registrar pedido` fica desabilitado quando o carrinho
  estiver vazio ou possuir configuração inválida.
- **Telas estreitas:** o carrinho pode assumir um painel dedicado, preservando
  acesso ao total e à ação principal.
- **Acessibilidade:** controles de quantidade, edição e remoção devem possuir
  nomes acessíveis; a mudança do card para `Adicionado` deve ser anunciada por
  tecnologia assistiva.

---

#### REQ-06 Precificação por Canal

- [ ] **Precificação por Canal**

**Descrição:** O sistema deve calcular preços e subtotais usando o canal
opcional selecionado para o pedido.

##### Regras de Negócio

- **Sem canal:** o preço final é igual ao preço-base.
- **Com canal:** aplica o mesmo percentual a todos os componentes pagos.
- **Escopo:** Porções, Revendas e acompanhamentos pagos recebem o ajuste.
- **Item gratuito:** preço-base igual a zero permanece igual a zero.
- **Fórmula:** `preço_ajustado = preço_base × (1 + percentual ÷ 100)`.
- **Arredondamento:** cada preço unitário ajustado é arredondado para duas casas
  decimais antes do subtotal.
- **Subtotal:** corresponde a `preço_unitário_arredondado × quantidade`.
- **Total:** corresponde à soma dos subtotais arredondados.
- **Troca de canal:** recalcula todos os itens ainda não registrados.
- **Canal único:** no máximo um canal pode ser aplicado ao pedido.
- **Sem exceção por produto:** o MVP não aceita percentual específico por
  produto e canal.
- **Preço inválido:** nenhuma combinação permitida pode tornar negativo o preço
  de um item pago.
- **Atualização não retroativa:** alterações no canal não mudam pedidos
  registrados.

##### Regras de UI/UX

- **Seletor:** deve oferecer canais ativos e a opção `Sem canal`.
- **Opcionalidade:** a ausência de canal não bloqueia o registro.
- **Feedback imediato:** seleção ou troca recalcula preços, subtotais e total.
- **Transparência:** deve exibir nome e percentual do canal selecionado.
- **Sem canal:** deve identificar que os preços-base estão sendo usados.
- **Loading:** o recálculo deve possuir estado visual quando não for instantâneo.
- **Erro:** falha de recálculo deve manter a seleção anterior e preservar o
  carrinho.
- **Acessibilidade:** o ajuste de preço não pode ser comunicado apenas por cor.

---

#### REQ-07 Revalidação de Canal, Combo e Estoque

- [ ] **Revalidação de Canal e Estoque**

**Descrição:** O sistema deve revalidar o canal, os Combos e todos os saldos
imediatamente antes de registrar o pedido.

##### Regras de Negócio

- **Concorrência:** múltiplos operadores podem registrar pedidos simultaneamente.
- **Canal atualizado:** o registro usa a configuração vigente do canal.
- **Canal alterado:** se nome ou percentual mudou, o carrinho é recalculado e
  exige nova confirmação.
- **Canal inativo ou excluído:** a seleção é removida; o operador pode seguir
  sem canal ou escolher outro.
- **Combos vigentes:** elegibilidade, composição, preço, status e melhor
  combinação devem ser recalculados com as configurações vigentes.
- **Combo alterado:** se o desconto ou a melhor combinação mudar, o carrinho é
  recalculado e exige nova confirmação.
- **Combo inválido:** o desconto é removido sem retirar seus produtos do
  carrinho.
- **Estoque atualizado:** a validação usa os saldos mais recentes.
- **Consolidação:** consumos que atingem o mesmo produto ou marca são somados
  antes da validação.
- **Estoque negativo:** não é permitido.
- **Sem exceção:** não existe configuração para permitir venda abaixo de zero.
- **Bloqueio total:** insuficiência em qualquer componente bloqueia o pedido
  inteiro.
- **Sem baixa parcial:** nenhuma movimentação é mantida após falha.
- **Carrinho preservado:** falhas de canal, Combo ou estoque não descartam os
  itens.
- **Nova tentativa:** o operador deve confirmar novamente depois da correção.

##### Regras de UI/UX

- **Canal alterado:** deve informar o percentual anterior e o atual.
- **Canal removido:** deve explicar que o pedido está usando preços-base até nova
  seleção.
- **Combo alterado:** deve informar que os descontos foram recalculados e
  solicitar revisão dos valores.
- **Item insuficiente:** deve ser destacado no carrinho.
- **Detalhamento:** deve informar produto ou marca, quantidade necessária,
  disponível e faltante.
- **Mensagem de exemplo:** `Estoque insuficiente de Granola Frooty: necessário
  300 g, disponível 200 g, faltam 100 g`.
- **Correção:** o operador deve conseguir editar ou remover o item afetado.
- **Ação bloqueada:** o registro permanece bloqueado enquanto houver
  insuficiência conhecida.
- **Acessibilidade:** mensagens devem ser associadas aos itens afetados e
  anunciadas por tecnologia assistiva.

---

#### REQ-08 Confirmação e Registro do Pedido

- [ ] **Confirmação e Registro do Pedido**

**Descrição:** O operador deve confirmar explicitamente o resumo antes de criar
um pedido definitivo e executar as baixas.

##### Regras de Negócio

- **Confirmação obrigatória:** o pedido não pode ser registrado por uma ação
  implícita.
- **Resumo:** deve conter canal ou `Sem canal`, quantidade de itens, Combos
  aplicados, economia e total.
- **Registro definitivo:** a confirmação cria um pedido concluído.
- **Sem pagamento:** não existe etapa de pagamento, caixa ou troco.
- **Transação atômica:** criação do pedido e baixas de estoque ocorrem na mesma
  transação.
- **Idempotência:** cliques repetidos, reenvios ou respostas atrasadas não podem
  duplicar pedido ou estoque.
- **Numeração:** cada sorveteria possui sequência própria crescente.
- **Identificação visível:** o usuário vê `Pedido #<número>`.
- **Identificador interno:** pode existir separadamente e não deve ser exibido
  como referência principal.
- **Imutabilidade:** o pedido não pode ser editado, cancelado, estornado ou
  excluído no MVP.
- **Sucesso:** limpa o carrinho somente depois da confirmação do servidor.
- **Falha:** não cria pedido nem mantém qualquer baixa.

##### Regras de UI/UX

- **Diálogo final:** deve permitir `Voltar ao carrinho` ou `Registrar pedido`.
- **Prevenção de envio duplo:** durante o processamento, a ação deve ficar
  bloqueada e indicar carregamento.
- **Sucesso:** deve exibir `Pedido #<número> registrado com sucesso` e iniciar um
  carrinho vazio.
- **Falha transacional:** deve exibir `Não foi possível registrar o pedido.
  Nenhum estoque foi alterado. Tente novamente`.
- **Conexão perdida:** deve preservar o carrinho na tela e permitir nova
  tentativa.
- **Ação irreversível:** o diálogo deve informar que o MVP não permite
  cancelamento ou estorno.
- **Acessibilidade:** foco deve ser movido para o diálogo e devolvido ao elemento
  de origem quando ele for fechado.

---

#### REQ-09 Snapshot do Pedido

- [ ] **Snapshot do Pedido**

**Descrição:** O pedido deve preservar os dados comerciais e operacionais
praticados no momento do registro.

##### Regras de Negócio

- **Dados gerais:** identificador, número sequencial, sorveteria, data, hora,
  operador, quantidade de itens e total.
- **Snapshot do canal:** identificador original, nome e percentual, quando
  selecionado.
- **Sem canal:** deve ser persistido explicitamente como ausência de canal.
- **Snapshot do produto:** identificador original, nome e categoria comercial.
- **Snapshot da marca:** identificador original e nome, quando aplicável.
- **Snapshot do tamanho:** identificador original, nome e quantidade consumida,
  quando aplicável.
- **Snapshot do acompanhamento:** identificador original, nome, tipo, quantidade
  consumida, preço-base e preço final.
- **Snapshot do Combo:** identificador original, nome, preço fixo, economia,
  configurações e quantidades participantes, preços anteriores ao desconto e
  vínculos com as linhas do pedido.
- **Preços:** cada linha preserva preço-base, preço final unitário, quantidade e
  subtotal.
- **Consumos:** devem ser preservadas as quantidades de estoque calculadas para a
  venda.
- **Exclusões cadastrais:** exclusão de qualquer cadastro não pode tornar o
  pedido ilegível.
- **Atualização não retroativa:** nenhuma alteração cadastral modifica snapshots.
- **Multi-tenancy:** snapshots pertencem exclusivamente à sorveteria do pedido.

##### Regras de UI/UX

- **Legibilidade:** histórico deve mostrar nomes copiados, não identificadores
  técnicos.
- **Canal ausente:** deve exibir `Sem canal`.
- **Valores:** deve exibir os valores efetivamente praticados.
- **Cadastro excluído:** não deve gerar mensagens de item ausente no histórico.
- **Estado de erro:** falha ao carregar detalhes deve permitir nova tentativa sem
  perder os filtros da listagem.
- **Responsividade:** detalhes extensos devem quebrar linha sem cortar conteúdo.
- **Acessibilidade:** agrupamentos devem possuir títulos e ordem de leitura
  coerente.

---

#### REQ-10 Histórico de Pedidos

- [ ] **Histórico de Pedidos**

**Descrição:** Operadores e Gerentes devem consultar todos os pedidos da
sorveteria atual e abrir seus detalhes.

##### Regras de Negócio

- **Ordenação:** pedidos mais recentes aparecem primeiro.
- **Filtro de período:** aceita data inicial e final.
- **Filtro de canal:** aceita um canal específico ou `Sem canal`.
- **Filtros combinados:** período e canal podem ser usados simultaneamente.
- **Escopo do Operador:** o Operador consulta pedidos de toda a sorveteria, não
  apenas os próprios.
- **Carregamento:** deve usar paginação ou carregamento incremental.
- **Reinício:** alterar filtros reinicia a navegação dos resultados.
- **Detalhes:** usam exclusivamente os snapshots registrados.
- **Sem mutações:** não existem ações de editar, cancelar, estornar ou excluir.
- **Sem relatórios:** métricas, dashboards e exportações não pertencem ao MVP.
- **Multi-tenancy:** pedidos de outras sorveterias nunca podem ser retornados.

##### Regras de UI/UX

- **Filtros:** período e canal devem aparecer acima da listagem.
- **Linha:** deve exibir número, data, hora, operador, canal, quantidade de itens
  e total.
- **Detalhe:** deve apresentar itens, configurações, quantidades, preços,
  subtotais, consumos e total.
- **Sem canal:** deve ser filtrável e exibido como `Sem canal`.
- **Loading:** deve usar skeletons ou indicador equivalente.
- **Estado vazio geral:** deve informar que ainda não existem pedidos.
- **Estado vazio filtrado:** deve informar que nenhum pedido corresponde aos
  filtros e oferecer `Limpar filtros`.
- **Fim da listagem:** não deve solicitar novos lotes quando não houver mais
  dados.
- **Erro:** deve preservar filtros e permitir tentar novamente.
- **Responsividade:** listagem pode adaptar colunas, mas número, data e total
  devem continuar visíveis.
- **Acessibilidade:** filtros, linhas acionáveis e detalhes devem ser navegáveis
  por teclado.

---

#### REQ-11 Permissões, Navegação e Isolamento

- [ ] **Permissões, Navegação e Isolamento**

**Descrição:** O módulo deve aplicar responsabilidades distintas e manter os
dados isolados por sorveteria.

##### Regras de Negócio

- **Navegação independente:** deve conter `Nova venda`, `Pedidos`,
  `Canais de venda` e `Descontos`, sem grupo pai.
- **Operador:** pode montar, registrar e consultar pedidos.
- **Gerente:** possui as permissões do Operador e gerencia canais e descontos.
- **Configuração de Produtos:** permanece fora do módulo de Vendas.
- **Autorização:** regras de perfil dependem do módulo de Auth.
- **Isolamento:** produtos, canais, sequências, pedidos e históricos são sempre
  filtrados pela sorveteria atual.
- **Acesso direto:** uma URL não pode contornar as permissões.
- **Auditoria mínima:** cada pedido deve preservar o operador responsável.

##### Regras de UI/UX

- **Menus:** itens sem permissão não devem ser exibidos.
- **Acesso negado:** deve apresentar orientação clara sem revelar dados.
- **Consistência:** títulos das páginas devem corresponder aos nomes da
  navegação.
- **Sem atalhos de produto:** `Nova venda` não oferece edição de cadastro.
- **Feedback de sessão:** perda de autenticação deve preservar o carrinho na tela
  quando tecnicamente possível e solicitar nova autenticação.
- **Responsividade:** navegação não pode bloquear o conteúdo principal em telas
  menores.
- **Acessibilidade:** estado ativo da navegação deve ser comunicado além da cor.

---

#### REQ-12 Desempenho, Responsividade e Acessibilidade

- [ ] **Desempenho, Responsividade e Acessibilidade**

**Descrição:** As quatro áreas do módulo devem responder com rapidez, funcionar
nos dispositivos prioritários e oferecer acesso inclusivo.

##### Regras de Negócio

- **Dispositivos prioritários:** computador e tablet em modo paisagem.
- **Busca:** deve apresentar resultados em até 1 segundo em condições normais.
- **Recálculo:** deve atualizar valores em até 1 segundo em condições normais.
- **Registro:** deve concluir em até 3 segundos em condições normais.
- **Meta operacional:** um operador treinado deve registrar um pedido comum em
  até 60 segundos.
- **Operação online:** conexão com o servidor é obrigatória.
- **Sem fila offline:** pedidos não são registrados localmente para sincronização
  posterior.
- **Segurança:** ações protegidas devem ser validadas também no servidor.
- **Consistência:** valores exibidos e persistidos devem usar a mesma regra de
  cálculo e arredondamento.

##### Regras de UI/UX

- **Layout principal:** catálogo e carrinho ficam lado a lado quando houver
  espaço.
- **Telas estreitas:** o carrinho pode abrir em painel separado.
- **Alvos de toque:** controles principais devem possuir área mínima de
  `44 × 44 px`.
- **Contraste:** textos e controles devem atender ao nível AA.
- **Semântica:** sucesso, alerta, erro e indisponibilidade não podem depender
  apenas de cor.
- **Teclado:** busca, catálogo, configurações, carrinho, diálogos e filtros devem
  ser operáveis por teclado.
- **Foco:** deve permanecer visível e seguir ordem lógica.
- **Leitores de tela:** rótulos, estados, erros e atualizações críticas devem ser
  comunicados.
- **Loading:** ações assíncronas devem apresentar feedback sem deslocamentos
  abruptos desnecessários.
- **Falha de conexão:** deve informar que a venda não foi registrada e preservar
  o carrinho atual para nova tentativa.

---

#### REQ-13 Gestão de Descontos do Tipo Combo

- [ ] **Gestão de Descontos do Tipo Combo**

**Descrição:** O Gerente deve conseguir criar e administrar descontos do tipo
Combo, formados por produtos distintos e vendidos por um preço final fixo.

##### Regras de Negócio

- **Tipo no MVP:** `Combo` é o único tipo de desconto disponível.
- **Campos:** cada Combo possui nome, tipo, componentes, preço final fixo e
  status `Ativo` ou `Inativo`.
- **Nome obrigatório:** não pode ser vazio ou conter apenas espaços.
- **Nome único:** não podem existir Combos com o mesmo nome na sorveteria,
  ignorando maiúsculas, minúsculas e espaços nas extremidades.
- **Composição mínima:** exige pelo menos dois produtos distintos.
- **Quantidade por componente:** deve ser um número inteiro maior que zero.
- **Porção exata:** o componente deve registrar produto, tamanho e conjunto de
  acompanhamentos incluídos.
- **Porção sem tamanho:** não pode ser adicionada ao Combo.
- **Revenda exata:** o componente deve registrar produto e marca, quando
  aplicável; Revenda não possui embalagem.
- **Preço fixo:** deve ser maior que zero e representa o valor final de uma
  aplicação do Combo, independentemente do canal de venda.
- **Economia obrigatória:** o Combo só pode ser ativado quando seu preço fixo
  for menor que a soma vigente dos componentes pelos preços-base.
- **Sem vigência:** o MVP não possui data inicial, data final ou agendamento.
- **Status ativo:** somente Combos ativos participam de novas vendas.
- **Inativação automática:** se um produto, tamanho, acompanhamento, marca ou
  configuração exigida ficar inválido, inativo ou for excluído, o Combo deve
  ser inativado automaticamente.
- **Reativação:** exige correção dos componentes e nova validação da economia.
- **Edição:** alterações afetam apenas carrinhos não registrados e pedidos
  futuros.
- **Exclusão:** qualquer Combo pode ser excluído após confirmação, mesmo quando
  já utilizado.
- **Histórico:** edição, inativação ou exclusão não altera pedidos registrados.
- **Multi-tenancy:** descontos pertencem exclusivamente à sorveteria atual.
- **Permissão:** somente Gerentes podem criar, editar, ativar, inativar ou
  excluir Combos.
- **Dependências:** Auth, Produtos, Canais de venda e Pedidos.

##### Regras de UI/UX

- **Navegação:** `Descontos` deve ser uma entrada independente do módulo.
- **Listagem:** deve exibir nome, tipo, preço do Combo, quantidade de produtos,
  status e ações.
- **Busca:** o placeholder deve ser
  `Buscar por nome do desconto ou produto…`.
- **Filtros:** deve oferecer somente `Tipo` e `Status`.
- **Criação:** a tela deve solicitar nome, componentes, preço final e status.
- **Adicionar produto:** deve abrir um diálogo que diferencia Porção de Revenda
  e exige a configuração exata aplicável.
- **Economia:** o formulário deve comparar a soma vigente dos componentes com o
  preço do Combo e exibir a economia calculada.
- **Validação inline:** nome duplicado, composição insuficiente, componente
  repetido ou inválido e preço sem economia devem ser informados junto ao campo
  correspondente.
- **Estado vazio:** deve explicar o objetivo dos descontos e oferecer
  `Criar primeiro desconto`.
- **Estado vazio filtrado:** deve oferecer `Limpar filtros`.
- **Exclusão:** deve apresentar confirmação informando que o histórico será
  preservado e carrinhos abertos serão revalidados.
- **Feedback:** criação, edição, ativação, inativação e exclusão devem apresentar
  sucesso, erro e carregamento.
- **Ação bloqueada:** Operadores não visualizam ações de gerenciamento.
- **Responsividade:** tabela, formulário e diálogo não podem ocultar campos ou
  ações principais em telas menores.
- **Acessibilidade:** campos, seletores, erros, status e confirmações devem ser
  operáveis por teclado e anunciados por tecnologia assistiva.

---

#### REQ-14 Aplicação Automática de Combos

- [ ] **Aplicação Automática de Combos**

**Descrição:** O sistema deve identificar e aplicar automaticamente os Combos
elegíveis no carrinho, escolhendo a combinação que produz a maior economia.

##### Regras de Negócio

- **Detecção automática:** incluir, editar ou remover uma linha, alterar sua
  quantidade ou trocar o canal deve recalcular os Combos elegíveis.
- **Correspondência exata:** uma unidade só atende a um componente quando
  produto, tamanho, acompanhamentos e marca correspondem integralmente à
  configuração do Combo, conforme aplicável.
- **Unidades participantes:** as quantidades exigidas devem existir no carrinho.
- **Aplicação única:** cada Combo pode ser aplicado no máximo uma vez por
  pedido.
- **Combos diferentes:** mais de um Combo pode ser aplicado no mesmo pedido.
- **Sem reutilização:** uma unidade de produto não pode participar de dois
  Combos.
- **Maior economia:** havendo disputa por unidades, o sistema deve escolher o
  conjunto de Combos com a maior economia total.
- **Desempate:** combinações com a mesma economia total devem priorizar, de
  forma determinística, os Combos criados primeiro.
- **Economia positiva:** um Combo só é aplicado quando reduz o total do pedido.
- **Aplicação obrigatória:** o Operador não pode remover manualmente um Combo
  elegível.
- **Linhas preservadas:** os produtos permanecem em suas linhas originais e
  conservam preço-base, preço ajustado por canal, quantidade e subtotal.
- **Desconto no pedido:** a economia do Combo deve ser registrada como desconto
  no nível do pedido, vinculada às unidades e linhas participantes, sem alterar
  o preço unitário original.
- **Fórmula:** `economia = soma dos preços finais das unidades participantes − preço fixo do Combo`.
- **Preço fixo independente:** o preço final do Combo não recebe ajuste do
  canal; produtos e unidades não consumidos por Combo continuam sujeitos ao
  canal selecionado.
- **Total:** corresponde à soma dos subtotais das linhas menos a soma dos
  descontos de Combo aplicados.
- **Revalidação:** imediatamente antes do registro, o sistema deve revalidar
  canal, estoque, componentes, status e preço de todos os Combos.
- **Carrinho atualizado:** se a melhor combinação mudar, o sistema recalcula o
  total, preserva os itens e exige nova revisão do Operador.
- **Combo inválido:** se deixar de ser elegível, seu desconto é removido e o
  Operador deve revisar o pedido.
- **Registro atômico:** snapshots dos Combos e vínculos com as linhas devem ser
  gravados na mesma transação do pedido e das baixas de estoque.
- **Snapshot do Combo:** deve preservar identificador original, nome, preço
  fixo, economia, componentes, configurações, quantidades, preços anteriores ao
  desconto e vínculos entre componentes e linhas do pedido.
- **Imutabilidade:** alterações ou exclusões posteriores não modificam o pedido.
- **Desempenho:** o recálculo de Combos deve terminar em até 1 segundo em
  condições normais, inclusive com Combos concorrentes.

##### Regras de UI/UX

- **Resumo automático:** o carrinho deve exibir cada Combo aplicado, uma
  aplicação, seus produtos participantes e a economia gerada.
- **Preços transparentes:** linhas mantêm os valores originais e o desconto do
  Combo aparece separadamente antes do total.
- **Sem controle manual:** não deve existir ação para remover ou selecionar um
  Combo.
- **Atualização:** alterações no carrinho devem atualizar Combos e total sem
  exigir recarregamento da página.
- **Conflito reutilizável:** conflitos identificados na revalidação devem usar
  um diálogo comum de conflitos do pedido, com título, motivo, itens afetados e
  ação de revisão.
- **Alerta:** mudanças de canal ou Combo que apenas recalculam valores usam
  tratamento de alerta e a ação `Revisar valores`.
- **Erro bloqueante:** produto, configuração ou estoque indisponível usa
  tratamento de erro e a ação `Revisar itens`.
- **Falha técnica:** falha de conexão ou processamento deve assegurar que o
  pedido não foi registrado parcialmente e oferecer `Tentar novamente`.
- **Carrinho preservado:** todos os diálogos de conflito mantêm os itens e as
  escolhas válidas.
- **Histórico:** o detalhe do pedido deve exibir nome, preço fixo, economia e
  produtos participantes de cada Combo aplicado.
- **Sem Combo:** quando nenhum Combo for elegível, o carrinho segue normalmente
  sem mensagem de erro.
- **Acessibilidade:** aplicação, remoção automática e alterações de total devem
  ser anunciadas sem depender somente de cor.

---

### 5. Fluxo de Usuário (User Flow)

#### Fluxo A - Gerente cria um canal de venda

1. O Gerente acessa `Canais de venda`.
2. O sistema apresenta os canais da sorveteria.
3. O Gerente seleciona `Novo canal`.
4. O Gerente informa nome, percentual e status.
5. O sistema valida:
   - Sucesso: cria o canal e atualiza a listagem.
   - Falha: mantém os dados e informa o campo inválido.
6. O fluxo termina.

#### Fluxo B - Gerente edita, inativa ou exclui um canal

1. O Gerente abre as ações de um canal.
2. Para editar, altera os dados e confirma.
3. Para inativar, muda o status e confirma.
4. Para excluir, revisa o aviso e confirma a ação destrutiva.
5. O sistema preserva os snapshots dos pedidos anteriores.
6. O sistema valida:
   - Sucesso: atualiza ou remove o canal das operações futuras.
   - Falha: mantém o estado anterior e informa o erro.
7. O fluxo termina.

#### Fluxo C - Gerente cria um Combo

1. O Gerente acessa `Descontos`.
2. O sistema apresenta a busca, os filtros `Tipo` e `Status` e os descontos da
   sorveteria.
3. O Gerente seleciona `Criar desconto` e escolhe o tipo `Combo`.
4. O Gerente informa um nome único e adiciona pelo menos dois produtos
   distintos.
5. Para cada Porção, informa tamanho, acompanhamentos incluídos e quantidade;
   para cada Revenda, informa marca quando aplicável e quantidade.
6. O Gerente informa o preço final fixo e o status.
7. O sistema calcula e apresenta a economia.
8. O sistema valida:
   - Sucesso: cria o Combo e atualiza a listagem.
   - Falha: preserva os dados e informa nome duplicado, composição inválida,
     componente indisponível ou ausência de economia.
9. O fluxo termina.

#### Fluxo D - Gerente edita, inativa ou exclui um Combo

1. O Gerente abre as ações de um Combo.
2. Para editar, altera seus dados e confirma.
3. Para inativar ou reativar, altera o status; uma reativação revalida todos os
   componentes e a economia.
4. Para excluir, revisa o aviso sobre histórico e carrinhos abertos e confirma.
5. O sistema preserva os snapshots dos pedidos registrados.
6. Carrinhos abertos são recalculados na próxima interação ou tentativa de
   registro.
7. O sistema valida:
   - Sucesso: atualiza ou remove o Combo das operações futuras.
   - Falha: mantém o estado anterior e informa o erro.
8. O fluxo termina.

#### Fluxo E - Operador inicia uma nova venda

1. O Operador acessa `Nova venda`.
2. O sistema apresenta a grade, a busca, os filtros, o seletor opcional de canal
   e o carrinho vazio.
3. O sistema usa preços-base enquanto nenhum canal estiver selecionado.
4. O Operador busca ou filtra produtos.
5. Produtos sem estoque permanecem visíveis como indisponíveis.
6. Produtos já presentes no carrinho permanecem visíveis com o selo
   `Adicionado` e bloqueados para nova seleção.
7. O fluxo segue para configuração de Porção ou Revenda.

#### Fluxo F - Operador adiciona uma Porção

1. O Operador seleciona uma Porção disponível.
2. O sistema apresenta tamanhos, acompanhamentos e quantidade.
3. O Operador configura o item.
4. O sistema calcula preço, consumo e subtotal.
5. O Operador seleciona `Adicionar ao carrinho`.
6. O sistema valida:
   - Produto ausente do carrinho: cria uma única linha e marca seu card como
     `Adicionado`.
   - Produto já presente: bloqueia a inclusão, preserva a linha existente e
     orienta o ajuste no carrinho.
   - Falha: preserva as escolhas e informa a correção necessária.
7. O fluxo retorna à montagem.

#### Fluxo G - Operador adiciona uma Revenda

1. O Operador seleciona uma Revenda disponível.
2. O sistema apresenta produto, marca quando aplicável e quantidade.
3. O Operador configura o item.
4. O sistema calcula preço, consumo e subtotal.
5. O Operador seleciona `Adicionar ao carrinho`.
6. O sistema valida:
   - Produto ausente do carrinho: cria uma única linha e marca seu card como
     `Adicionado`.
   - Produto já presente: bloqueia a inclusão, preserva a linha existente e
     orienta o ajuste no carrinho.
   - Falha: preserva os dados e informa a correção necessária.
7. O fluxo retorna à montagem.

#### Fluxo H - Operador edita o carrinho

1. O Operador abre um item do carrinho.
2. O sistema apresenta a configuração atual.
3. O Operador altera tamanho, marca, acompanhamentos ou quantidade.
4. O sistema recalcula preço, consumo e subtotal.
5. O Operador confirma:
   - Sucesso: atualiza a única linha existente para o produto.
   - Falha: preserva a edição e informa o problema.
6. O fluxo retorna ao carrinho.

#### Fluxo I - Sistema aplica Combos automaticamente

1. O Operador inclui, edita ou remove produtos ou altera quantidades.
2. O sistema identifica todos os Combos ativos com correspondência exata.
3. O sistema resolve disputas sem reutilizar unidades e escolhe a combinação de
   maior economia total; em empate, prioriza os Combos criados primeiro.
4. Cada Combo pode aparecer uma vez, mas Combos diferentes podem coexistir.
5. O sistema mantém os produtos em linhas separadas e exibe os descontos no
   resumo do pedido.
6. O Operador não pode remover manualmente os Combos elegíveis.
7. Se nenhum Combo gerar economia, o pedido permanece sem desconto.
8. O fluxo retorna à montagem.

#### Fluxo J - Operador seleciona ou troca o canal

1. O Operador abre o seletor de canal.
2. O sistema apresenta canais ativos e `Sem canal`.
3. O Operador escolhe uma opção.
4. O sistema recalcula todos os componentes pagos.
5. O sistema atualiza preços, subtotais e total.
6. Em caso de falha, mantém a seleção anterior e preserva o carrinho.
7. O fluxo retorna à montagem.

#### Fluxo K - Operador registra um pedido

1. O Operador seleciona `Registrar pedido`.
2. O sistema revalida canal, Combos, configurações e estoque.
3. O sistema apresenta número de itens, canal ou `Sem canal`, Combos aplicados,
   economia e total.
4. O Operador confirma `Registrar pedido`.
5. O sistema executa em uma transação:
   - criação do pedido;
   - geração do número sequencial;
   - gravação dos snapshots;
   - gravação dos descontos e vínculos dos Combos;
   - baixa de todos os estoques.
6. O sistema exibe `Pedido #<número> registrado com sucesso`.
7. O sistema limpa o carrinho.
8. O fluxo termina.

#### Fluxo L - Canal muda durante a montagem

1. O Operador tenta registrar um pedido com canal selecionado.
2. O sistema identifica que o canal foi alterado.
3. O sistema recalcula o carrinho com o percentual vigente.
4. O sistema informa a alteração.
5. O Operador revisa e confirma novamente.
6. Se o canal foi inativado ou excluído, o sistema remove a seleção e permite
   seguir sem canal ou escolher outro.
7. O fluxo retorna à confirmação.

#### Fluxo M - Estoque fica insuficiente

1. O Operador tenta registrar um pedido.
2. O sistema consolida e revalida todos os consumos.
3. Um produto ou marca não possui saldo suficiente.
4. O sistema bloqueia o pedido inteiro.
5. Nenhum pedido ou baixa é persistido.
6. O carrinho é preservado e os itens insuficientes são destacados.
7. O Operador edita ou remove os itens e tenta novamente.

#### Fluxo N - Falha de conexão ou processamento

1. O Operador tenta registrar um pedido.
2. A conexão ou a transação falha.
3. O sistema confirma que nenhuma baixa parcial foi mantida.
4. O carrinho permanece na tela.
5. O sistema oferece `Tentar novamente`.
6. O fluxo retorna à confirmação.

#### Fluxo O - Combo muda durante a montagem

1. O Operador tenta registrar um pedido com Combo aplicado.
2. O sistema identifica alteração, inativação, exclusão ou perda de elegibilidade
   do Combo.
3. O sistema recalcula a melhor combinação e o total.
4. O sistema abre o diálogo reutilizável de conflito do pedido e informa os
   descontos alterados ou removidos.
5. Os produtos permanecem no carrinho.
6. O Operador seleciona `Revisar valores` ou `Revisar itens`, conforme o tipo de
   conflito.
7. Depois da revisão, o Operador confirma novamente.

#### Fluxo P - Usuário consulta pedidos

1. O usuário acessa `Pedidos`.
2. O sistema apresenta os pedidos mais recentes da sorveteria.
3. O usuário filtra por período e canal, inclusive `Sem canal`.
4. O sistema reinicia e atualiza a listagem.
5. O usuário abre um pedido.
6. O sistema apresenta os snapshots completos da venda, incluindo Combos,
   economia e produtos participantes.
7. Não são oferecidas ações de edição, cancelamento, estorno ou exclusão.
8. O fluxo termina.

---

### 6. Fora do Escopo (Out of Scope)

- Formas de pagamento, caixa, troco, sangria, suprimento e conciliação.
- Cancelamento ou estorno de pedidos.
- Edição ou exclusão de pedidos registrados.
- Identificação, cadastro ou histórico de clientes.
- Fidelidade, cashback, cupons ou crédito de cliente.
- Tipos de desconto diferentes de Combo.
- Mecânica `Pague X, leve Y`.
- Combo formado por apenas um produto ou por menos de dois produtos distintos.
- Mais de uma aplicação do mesmo Combo no pedido.
- Vigência, data inicial, data final ou agendamento de descontos.
- Seleção, aplicação ou remoção manual de Combo pelo Operador.
- Observações livres por item ou pedido.
- Impressão de recibo, cupom ou documento fiscal.
- NFC-e, SAT, NF-e ou outras integrações fiscais.
- Integração com iFood, Rappi, WhatsApp, maquininhas ou outros sistemas.
- Importação automática de pedidos externos.
- Operação offline e sincronização posterior.
- Preço ou percentual específico por `produto + canal`.
- Mais de um canal ou modificador no mesmo pedido.
- Modificador manual separado do canal.
- Relatórios, dashboards, indicadores e exportações.
- Rascunhos persistentes de pedidos.
- Reserva de estoque ao adicionar ao carrinho.
- Configuração de produtos, tamanhos, marcas, acompanhamentos ou estoque dentro
  do módulo de Vendas.
- Mesas, comandas, cozinha, divisão de conta e entrega.
- Gestão multiloja avançada para redes e franquias.
- Inventário físico, lotes, validade, perdas e desperdícios.

#### Descartado durante a definição

- **Múltiplas linhas ou agrupamento do mesmo produto:** descartado; cada produto
  pode ocupar somente uma linha, e novas unidades ou configurações devem ser
  ajustadas no item existente do carrinho.
- **Nome `PDV`:** substituído por `Nova venda`.
- **Grupo de navegação `Vendas`:** descartado; `Nova venda`, `Pedidos` e
  `Canais de venda` são entradas independentes.
- **Modificador de preço genérico:** substituído por `Canal de venda`.
- **Canal padrão:** descartado; nenhum canal é selecionado automaticamente.
- **Canal obrigatório:** descartado; pedidos sem canal usam preços-base.
- **Preço por produto e canal:** adiado; o MVP usa um percentual global.
- **Ocultar produtos sem estoque:** substituído por exibição indisponível.
- **Remover e adicionar novamente para editar:** substituído por edição direta.
- **Bloquear exclusão de canal utilizado:** substituído por snapshot no pedido.
- **Combo como produto do catálogo:** descartado; os produtos permanecem em
  linhas separadas e o Combo é registrado como desconto do pedido.
- **Combo com um único produto:** descartado; Combo exige pelo menos dois
  produtos distintos e `Pague X, leve Y` permanece uma mecânica separada.
- **Múltiplas aplicações do mesmo Combo:** descartado; cada Combo pode ser
  aplicado no máximo uma vez por pedido.
- **Escolha manual entre Combos concorrentes:** substituída pela aplicação
  automática da combinação com maior economia total.
- **Remoção manual de Combo elegível:** descartada para garantir consistência da
  oferta durante o atendimento.
- **Fabricável como categoria de venda:** um Fabricável só aparece quando também
  é Porção ou Revenda.
- **Tabela de preços separada:** preços-base permanecem no módulo de Produtos.
- **Estoque negativo:** descartado; nenhuma venda pode produzir saldo negativo.
- **Baixa parcial:** descartada; qualquer insuficiência bloqueia toda a venda.
- **Rascunho persistente:** descartado; o carrinho existe apenas durante a
  montagem atual.
