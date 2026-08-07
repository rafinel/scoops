### 1. Visão Geral

O **MRP/Estoque do Scoops** é a área operacional responsável por cadastrar
produtos, organizar marcas, controlar saldos, definir receitas, registrar
produções e configurar acompanhamentos.

O módulo conecta a composição dos produtos ao estoque disponível. A partir de
uma receita e dos saldos atuais, o gerente consegue saber quanto pode produzir,
quais ingredientes limitam a produção e qual é o custo operacional da receita.

As quantidades exibidas no design atual usam gramas. A unidade de estoque é
herdada pelos dados dependentes do produto, como marcas, receitas e tamanhos.

**Objetivo:** dar ao gerente controle e previsibilidade sobre o ciclo
`produto → marca → receita → produção → estoque`.

**Problema resolvido:** sem uma visão integrada, a falta de ingredientes só é
percebida durante a produção, causando atrasos e vendas perdidas. Também fica
difícil entender quanto um produto fabricável consome e qual é o seu custo
operacional.

**Valor entregue:** permite identificar restrições de estoque antes da produção,
calcular CMV em tempo real, controlar marcas e embalagens, produzir com baixa
atômica e manter os produtos prontos para venda no PDV.

**Usuários:** Gerente gerencia produtos, marcas, receitas e configurações.
Funcionário pode registrar produção conforme as permissões definidas pelo módulo
de autenticação.

**Multi-tenancy:** produtos, marcas, receitas, produções e saldos são isolados
por sorveteria.

---

### 2. Requisitos

#### REQ-01 Cadastro e Categorias de Produto

- [ ] **Cadastro e Categorias de Produto**

**Descrição:** O sistema deve permitir cadastrar um produto com uma ou mais
categorias, unidade, controle de estoque e status.

##### Regras de Negócio

- **Nome:** obrigatório e único dentro da sorveteria.
- **Unidade:** pertence ao produto e é herdada por marcas, receitas, tamanhos e
  operações dependentes.
- **Unidades disponíveis:** o modelo pode suportar `g`, `ml`, `kg`, `l` e `un`,
  mas os exemplos e o design atual devem usar gramas.
- **Controle:** o produto pode usar `Estoque único` ou `Por marca`.
- **Padrão:** novos produtos iniciam com `Estoque único`.
- **Categorias:** `Ingrediente`, `Fabricável`, `Porção`, `Acompanhamento` e
  `Revenda`.
- **Porção e Revenda:** são mutuamente exclusivas.
- **Fabricável:** habilita receita e produção, mas não torna o produto vendável
  sozinho.
- **Porção:** representa a venda fracionada de um estoque a granel e exige pelo
  menos um tamanho para aparecer no PDV.
- **Acompanhamento:** representa um produto que pode ser vinculado a uma Porção.
- **Revenda:** representa venda em embalagem inteira.
- **Combinações:** Fabricável + Porção é permitido; Fabricável sem Porção pode
  ser produzido sem aparecer no PDV; Acompanhamento + Porção ou Revenda é
  permitido.
- **Status:** produto inativo permanece cadastrado, mas não aparece em operações
  novas.
- **Estoque ideal:** opcional; quando preenchido, permite classificar o estoque
  como Normal ou Baixo.
- **Observações internas:** texto livre visível somente para usuários autorizados
  pelo módulo de Auth.
- **Estoque negativo:** não existe opção para permitir estoque negativo.
- **Multi-tenancy:** nenhum produto de outra sorveteria pode ser exibido ou
  utilizado.

##### Regras de UI/UX

- **Modal de cadastro:** deve conter Nome, Unidade, Categorias e Controle de
  Estoque.
- **Categorias:** devem ser cards selecionáveis com checkbox e indicação de
  dependências.
- **Exclusão Porção × Revenda:** ao selecionar uma, a outra deve ficar
  desabilitada com explicação.
- **Fabricável:** quando selecionado, o controle deve ficar travado em Estoque
  único, se essa for a regra vigente do modelo operacional.
- **Validação inline:** erros devem aparecer junto ao campo correspondente.
- **Pós-cadastro:** após criar, o sistema deve abrir a página dedicada do
  produto.
- **Unidade:** o design de produtos de peso deve exibir quantidades em gramas,
  sem alternar visualmente entre gramas e quilogramas.

---

#### REQ-02 Gestão de Marcas e Marca Principal

- [ ] **Gestão de Marcas e Marca Principal**

**Descrição:** Produtos com estoque por marca devem permitir cadastrar marcas,
controlar seus saldos e definir a marca principal usada em baixas automáticas.

##### Regras de Negócio

- **Aplicação:** marcas existem somente em produtos com controle `Por marca`.
- **Campos:** Nome, Quantidade da embalagem, Valor por embalagem e Estoque
  atual.
- **Unidade herdada:** a marca não define sua própria unidade; usa a unidade do
  produto pai.
- **Quantidade da embalagem:** deve ser maior que zero e representa a quantidade
  de unidade base contida em uma embalagem.
- **Estoque:** é armazenado na unidade base do produto.
- **Entrada por embalagem:** `quantidade_de_embalagens × quantidade_da_embalagem`.
- **Entrada por unidade:** o gerente também pode informar diretamente a
  quantidade em unidade base.
- **Preço unitário:** calculado por
  `valor_por_embalagem ÷ quantidade_da_embalagem`.
- **Marca principal:** enquanto houver marcas cadastradas, deve existir uma
  marca principal para baixas automáticas sem escolha explícita.
- **Uma principal ativa:** o produto mantém uma única marca principal por vez.
- **Primeira marca:** ao cadastrar a primeira marca, ela é definida
  automaticamente como principal.
- **Troca:** a nova marca passa a ser usada somente nas próximas operações.
- **Exclusão da principal:** se houver outras marcas, uma delas deve ser definida
  como principal antes da exclusão. Se for a última, a exclusão pode ocorrer com
  aviso e o produto fica indisponível até receber uma nova marca principal.
- **Nomes:** não podem existir duas marcas com o mesmo nome no produto.
- **Exclusão:** marcas são apagadas após confirmação e aviso dos impactos.
- **Dependências:** a exclusão deve informar receitas, vínculos e configurações
  que serão apagados junto.
- **Custo de receita:** alterações no valor da marca recalculam o CMV das
  receitas que usam o produto ou a marca principal correspondente.

##### Regras de UI/UX

- **Tabela de marcas:** deve exibir Marca, Embalagem, Valor/embalagem, Preço
  unitário, Estoque e Ações.
- **Chip principal:** a marca principal deve exibir o chip `Principal`.
- **Switch:** cada marca deve possuir um switch para defini-la como principal.
- **Menu de ações:** deve conter Editar marca, Definir como principal e Excluir
  marca.
- **Exclusão:** deve abrir diálogo de confirmação com o nome da marca e os
  impactos conhecidos.
- **Estado vazio:** deve exibir `Adicionar primeira marca`.
- **Entrada:** o modal deve permitir alternar entre Embalagens e Unidade base.
- **Preview:** ao informar embalagens, mostrar o total convertido em gramas como
  texto de apoio.

---

#### REQ-03 Controle e Ajuste de Estoque

- [ ] **Controle e Ajuste de Estoque**

**Descrição:** O sistema deve exibir o saldo atual, permitir entradas e baixas
manuais e impedir qualquer operação que resulte em estoque negativo.

##### Regras de Negócio

- **Estoque único:** o saldo pertence diretamente ao produto.
- **Por marca:** o estoque total é a soma dos saldos das marcas.
- **Entrada:** adiciona quantidade positiva ao produto ou à marca selecionada.
- **Baixa manual:** remove quantidade positiva do produto ou da marca selecionada.
- **Ajuste:** toda alteração manual deve ser tratada como entrada ou baixa.
- **Saldo mínimo:** nenhuma baixa pode resultar em saldo menor que zero.
- **Validação:** quantidade obrigatória e maior que zero.
- **Unidade:** quantidade do ajuste deve usar a unidade base do produto.
- **Produção:** aumenta o estoque do Fabricável depois de baixar seus
  ingredientes.
- **Venda:** o PDV é responsável por baixar produtos, acompanhamentos e
  Revendas conforme o PRD de PDV.
- **Marca principal:** produção e outras baixas automáticas sem seleção explícita
  usam a marca principal.
- **Atualização de disponibilidade:** entradas e baixas recalculam estoque total,
  situação e capacidade de produção.
- **Histórico:** o histórico de movimentações e auditoria está fora do escopo
  desta versão.

##### Regras de UI/UX

- **Resumo:** deve exibir Estoque atual, Estoque ideal e Situação.
- **Situação Normal:** quando o saldo total for maior ou igual ao estoque ideal.
- **Situação Baixo:** quando o saldo total for menor que o estoque ideal.
- **Sem estoque ideal:** exibir situação Normal sem comparação de meta.
- **Ações:** Entrada e Baixa devem ficar próximas ao saldo correspondente.
- **Insuficiência:** o botão de confirmar baixa deve ficar bloqueado quando a
  quantidade exceder o saldo.
- **Mensagem:** informar quantidade disponível e quantidade solicitada.
- **Zero:** saldo zero deve ser exibido como estado válido, não como ausência de
  cadastro.

---

#### REQ-04 Listagem de Produtos

- [ ] **Listagem de Produtos**

**Descrição:** A tela de Produtos deve permitir consultar, filtrar, ordenar e
  abrir os produtos cadastrados.

##### Regras de Negócio

- **Filtros:** categoria, situação do estoque e status do produto.
- **Filtros combinados:** seções diferentes usam AND; múltiplas categorias usam
  OR entre si.
- **Busca:** filtra por nome.
- **Ordenação:** Nome, Quantidade de estoque, Número de marcas, Categorias e
  Unidade.
- **Paginação:** a listagem deve ser paginada.
- **KPIs:** cards de resumo devem respeitar os filtros ativos.
- **Cards operacionais:** podem exibir Produtos, Marcas, Estoque baixo e Produtos
  com produção limitada.
- **Valor em estoque:** não deve aparecer como KPI deste módulo; pertence a uma
  tela financeira de custos, lucros e movimentações.
- **Estoque baixo:** usa a comparação com estoque ideal.
- **Estado vazio:** deve diferenciar ausência de produtos de filtros sem
  resultados.

##### Regras de UI/UX

- **Tabela:** deve ocupar todo o espaço disponível abaixo dos filtros.
- **Filtros:** devem permanecer na posição definida pelo layout aprovado e não
  disputar espaço horizontal com a tabela.
- **Colunas:** Nome, Quantidade de estoque, Número de marcas, Categorias e
  Unidade, além das ações necessárias.
- **Linha baixa:** pode usar fundo de alerta, indicador vermelho e texto
  explicativo.
- **Busca:** deve possuir ícone e placeholder contextual.
- **Limpar:** deve remover todos os filtros ativos.
- **Estado vazio sem produtos:** CTA `Cadastrar primeiro produto`.
- **Estado vazio com filtros:** mensagem `Nenhum produto encontrado` e CTA
  `Limpar filtros`.

---

#### REQ-05 Página Dedicada e Configurações do Produto

- [ ] **Página Dedicada e Configurações do Produto**

**Descrição:** Cada produto deve possuir uma página dedicada com abas e seções
  condicionais por categoria.

##### Regras de Negócio

- **Aba Estoque:** sempre disponível.
- **Aba Receita:** disponível para Fabricável.
- **Aba Acompanhamentos:** disponível para Porção.
- **Aba Preços — Tamanhos:** disponível para Porção; os dados comerciais são
  consumidos pelo PDV.
- **Aba Preços — Revenda:** disponível para Revenda; os dados comerciais são
  consumidos pelo PDV.
- **Aba Configurações:** sempre disponível.
- **Categorias em uso:** não podem ser removidas sem resolver suas
  dependências.
- **Alteração de unidade:** afeta marcas, receitas, tamanhos, consumo e
  operações dependentes do produto.
- **Aviso de unidade:** qualquer mudança de unidade deve exibir um diálogo com
  os impactos antes da confirmação.
- **Conversão:** não existe conversão automática entre g↔kg ou ml↔l nesta versão.
- **Exclusão de produto:** apaga o produto e seus dados dependentes após aviso e
  confirmação, incluindo marcas, receita, tamanhos, vínculos e configurações de
  venda.
- **Dependências externas:** produtos de outros cadastros permanecem intactos,
  mas os vínculos com o produto apagado são removidos.

##### Regras de UI/UX

- **Cabeçalho:** deve exibir nome, unidade, status, chips de categoria e ações
  Editar e Remover.
- **Breadcrumb:** `Estoque > Produtos > [Nome do produto]`.
- **Abas:** devem aparecer somente quando habilitadas pela categoria.
- **Configurações:** devem conter Informações Básicas, Controle de Estoque,
  Categorias, Observações internas e Zona de Perigo.
- **Unidade:** o diálogo deve explicar que a unidade é compartilhada por marcas,
  receitas, tamanhos e movimentações.
- **Exclusão:** o diálogo destrutivo deve listar o que será apagado.
- **Salvamento:** campos simples podem salvar ao perder foco, conforme o padrão
  de design do módulo.

---

#### REQ-06 Receitas de Produtos Fabricáveis

- [ ] **Receitas de Produtos Fabricáveis**

**Descrição:** Uma receita deve definir os ingredientes necessários para produzir
  uma quantidade de referência de um produto Fabricável.

##### Regras de Negócio

- **Uma receita:** cada Fabricável possui uma única receita nesta versão.
- **Rendimento de referência:** o gerente define a quantidade base da receita,
  sempre na unidade do produto fabricável.
- **Ingrediente elegível:** somente produtos com categoria Ingrediente podem
  entrar na receita.
- **Acompanhamento:** não pode ser usado como ingrediente de receita.
- **Campos da linha:** produto ingrediente, quantidade e unidade herdada.
- **Unidade:** a quantidade do ingrediente usa a mesma unidade de estoque do
  ingrediente; o design atual apresenta os valores em gramas.
- **Marca:** quando o ingrediente possui estoque por marca, a receita usa a marca
  principal vigente no momento da produção.
- **Marca exibida:** a tabela deve identificar qual marca principal será usada.
- **Sem marca principal:** a produção fica bloqueada até que uma marca principal
  seja definida.
- **Quantidade:** cada quantidade deve ser maior que zero.
- **Duplicidade:** a mesma combinação de ingrediente não pode aparecer duas vezes.
- **CMV:** custo do ingrediente é calculado com o preço unitário vigente.
- **CMV total:** soma dos custos de todas as linhas para o rendimento de
  referência.
- **Custo unitário:** para Fabricável, é calculado por
  `CMV total ÷ rendimento de referência`.
- **Máximo produzível:** é o menor limite calculado entre todos os ingredientes.
- **Atualização:** alterações em receita, marca ou entrada de estoque recalculam
  CMV e capacidade de produção.
- **Remoção de ingrediente:** remove somente a linha da receita.

##### Regras de UI/UX

- **Cabeçalho:** deve exibir rendimento de referência e ação Produzir.
- **Tabela:** deve exibir Insumo, Fonte/Marca, Quantidade, Custo, % do CMV,
  Estoque e Ações.
- **Unidades:** o design deve usar gramas em quantidades e projeções.
- **Fonte:** exibir chip da marca principal quando o estoque for por marca.
- **Estoque suficiente:** mostrar saldo atual e capacidade estimada.
- **Insumo limitante:** destacar a linha com ícone e fundo de alerta.
- **Insumo insuficiente:** a própria linha deve mostrar necessário, disponível e
  faltante; não depender de uma lista separada.
- **Adicionar:** botão `Adicionar ingrediente` deve inserir ou abrir a nova
  configuração de linha.
- **Excluir:** deve exigir confirmação e informar que CMV e capacidade serão
  recalculados.
- **Estado vazio:** orientar o gerente a adicionar o primeiro ingrediente.

---

#### REQ-07 Registro de Produção

- [ ] **Registro de Produção**

**Descrição:** O gerente ou funcionário autorizado deve registrar a produção de
  um Fabricável, consumindo os ingredientes e adicionando o produto produzido ao
  estoque.

##### Regras de Negócio

- **Acesso:** ação Produzir fica disponível na receita ou no produto Fabricável.
- **Modos:** o operador pode informar a produção por Lote ou por Quantidade.
- **Switch:** a mudança entre os modos é feita por um switch.
- **Lote:** representa exatamente o rendimento de referência da receita.
- **Quantidade:** deve ser informada na unidade do produto; o design atual usa
  gramas.
- **Sincronização:** alterar lotes atualiza a quantidade e alterar quantidade
  atualiza lotes quando houver equivalência.
- **Consumo:**
  `quantidade_do_ingrediente × (quantidade_produzida ÷ rendimento_de_referência)`.
- **Projeção:** deve calcular consumo, estoque atual e estoque após produção para
  cada ingrediente ou marca principal.
- **Insuficiência:** se qualquer ingrediente estiver insuficiente, a confirmação
  é bloqueada.
- **Baixa:** ocorre no produto ingrediente ou na marca principal, conforme o
  controle de estoque.
- **Entrada:** a quantidade produzida é adicionada ao estoque do Fabricável.
- **Acompanhamentos:** não são consumidos na produção.
- **Custo:** custo da produção pode ser calculado pelo CMV multiplicado pela
  quantidade de lotes; valor em estoque e lucro pertencem ao módulo financeiro.
- **Atômica:** baixas dos ingredientes e entrada do Fabricável devem ocorrer na
  mesma transação.
- **Falha:** se qualquer operação falhar, nenhuma alteração permanece.
- **Estoque negativo:** nunca permitir confirmação que gere saldo negativo.

##### Regras de UI/UX

- **Modal:** deve exibir produto, rendimento e switch Lote/Quantidade.
- **Lote:** mostrar o campo de lotes e, abaixo dele, o preview textual da
  quantidade equivalente, como `Equivale a 2.000 g`.
- **Quantidade:** mostrar input com sufixo `g`.
- **Layout:** controles de modo e entrada devem ficar organizados lado a lado
  quando houver espaço.
- **Atalhos:** podem existir opções `1 lote`, `2 lotes` e `Máximo`.
- **Tabela de projeção:** deve exibir Insumo/Marca, Consumo, Atual e Após.
- **Linha insuficiente:** deve ficar vermelha e mostrar necessário, disponível e
  faltante na própria tabela.
- **Botão:** `Confirmar produção` deve ficar desabilitado quando houver falta.
- **Sucesso:** fechar o modal, atualizar estoques e confirmar a produção.
- **Falha:** manter o contexto, informar que nenhuma alteração foi aplicada e
  permitir nova tentativa.

---

#### REQ-08 Acompanhamentos e Tipos de Acompanhamento

- [ ] **Acompanhamentos e Tipos de Acompanhamento**

**Descrição:** O gerente deve configurar quais produtos Acompanhamento podem ser
  oferecidos em cada Porção.

##### Regras de Negócio

- **Vínculo:** uma Porção pode possuir zero ou mais acompanhamentos.
- **Uso múltiplo:** um Acompanhamento pode ser vinculado a várias Porções.
- **Produto elegível:** somente a categoria Acompanhamento pode ser vinculada.
- **Tipo:** cada vínculo possui um tipo, como Cobertura, Extra ou Grátis.
- **Tipo contextual:** o tipo pode variar entre produtos Porção.
- **Quantidade por porção:** define o consumo em cada unidade vendida.
- **Preço:** é configurado pela combinação produto + tamanho + acompanhamento e
  pertence ao fluxo comercial do PDV.
- **Marca:** o consumo usa a marca principal do acompanhamento quando o estoque
  é por marca.
- **Remoção:** apagar o vínculo não altera saldos atuais.
- **Tipo em uso:** um tipo utilizado em vínculos não pode ser apagado sem que os
  vínculos sejam resolvidos.

##### Regras de UI/UX

- **Tabela:** deve exibir Acompanhamento, Tipo, Marca, Quantidade por porção e
  Ações.
- **Vincular:** botão `Vincular acompanhamento` deve abrir modal.
- **Modal:** campos Acompanhamento, Tipo, Quantidade por porção e preview de
  custo; marca aparece quando aplicável.
- **Marca principal:** exibir a marca principal usada na baixa.
- **Preço:** pode ser exibido por tamanho, mas a configuração comercial deve
  permanecer coerente com o PRD de PDV.
- **Tipos:** dropdown deve oferecer link `Gerenciar tipos`.
- **Acompanhamento opcional:** nenhum componente deve obrigar a criação de um
  acompanhamento para uma Porção.
- **Exclusão:** remoção do vínculo exige confirmação.

---

#### REQ-09 Configurações Comerciais Integradas

- [ ] **Configurações Comerciais Integradas**

**Descrição:** A página do produto deve apresentar as configurações necessárias
  para que o PDV utilize tamanhos e Revendas, sem duplicar a lógica de venda.

##### Regras de Negócio

- **Porção:** cada tamanho possui nome, quantidade em unidade de estoque, preço
  de venda e status.
- **Obrigatoriedade:** toda Porção vendável precisa de pelo menos um tamanho
  ativo.
- **Revenda:** possui preço de venda, quantidade da embalagem e disponibilidade.
- **Revenda por marca:** cada marca pode possuir preço e disponibilidade próprios.
- **Acompanhamento:** o preço é específico para produto + tamanho + acompanhamento.
- **Atualização:** alterações não modificam pedidos anteriores.
- **Responsabilidade:** regras de cálculo, carrinho, baixa de venda e histórico
  de pedidos pertencem ao PRD de PDV.

##### Regras de UI/UX

- **Abas condicionais:** Preços — Tamanhos aparece somente para Porção; Preços —
  Revenda aparece somente para Revenda.
- **Tamanhos:** tabela deve exibir Nome, Quantidade, Custo operacional, Preço,
  Lucro/Margem quando o módulo financeiro estiver disponível e Ações.
- **Financeiro:** o valor total em estoque, lucros e relatórios financeiros não
  devem ser apresentados como KPI do MRP.
- **Status:** tamanhos e marcas devem permitir ativação e inativação sem apagar
  configurações automaticamente.
- **PDV:** produtos sem configuração comercial ativa não aparecem no PDV.

---

#### REQ-10 Navegação, Estados e Confirmações

- [ ] **Navegação, Estados e Confirmações**

**Descrição:** O MRP deve oferecer navegação consistente, estados claros e
  confirmações para alterações destrutivas ou de alto impacto.

##### Regras de Negócio

- **Navegação principal:** Dashboard, Produtos, PDV, Histórico de Pedidos e
  Modificadores de Preço.
- **Sem subbotões:** a navegação principal não deve criar subnavegação desnecessária.
- **Produto:** abrir a linha ou ação Detalhes leva à página dedicada.
- **Categorias em uso:** tentativa de remoção deve ser bloqueada até resolver
  dependências.
- **Exclusões:** produtos, marcas, ingredientes, acompanhamentos e tamanhos são
  apagados após aviso e confirmação.
- **Zona de perigo:** deve listar o que será apagado antes da confirmação.
- **Autenticação:** perfis, permissões e usuários pertencem ao módulo Auth.
- **Unidade:** mudança de unidade exige diálogo de aviso antes de salvar.

##### Regras de UI/UX

- **Breadcrumb:** manter o contexto `Estoque > Produtos > Produto`.
- **Estados de carregamento:** busca, salvamento, cálculo e produção devem ter
  feedback visual.
- **Estado vazio:** cada tabela deve orientar a próxima ação.
- **Dialog de unidade:** informar que a unidade é compartilhada por marcas,
  receitas, tamanhos e operações dependentes.
- **Dialog de exclusão:** usar linguagem destrutiva clara, com Cancelar e
  Remover.
- **Responsividade:** tabelas, cards e modais não podem sobrepor ou cortar
  conteúdo em telas menores.
- **Consistência visual:** usar os componentes, tokens e ícones definidos no guia
  de design.

---

### 3. Fluxo de Usuário (User Flow)

**Fluxo A - Usuário consulta Produtos**

1. O usuário acessa `Produtos`.
2. O sistema exibe cards operacionais, filtros, busca e tabela.
3. O usuário filtra por categoria, estoque ou status.
4. O sistema aplica filtros combinados e recalcula os cards.
5. O usuário ordena por Nome, Quantidade de estoque, Número de marcas,
   Categorias ou Unidade.
6. O usuário abre `Detalhes` de um produto.
7. O sistema abre a página dedicada na aba Estoque.

**Fluxo B - Usuário cadastra produto**

1. O gerente clica em `Novo produto`.
2. O sistema exibe Nome, Unidade, Categorias e Controle de estoque.
3. O gerente preenche os campos.
4. O sistema valida:
   - **Sucesso:** cria o produto ativo com saldo zero e abre sua página.
   - **Nome duplicado:** informa que o nome já existe.
   - **Sem unidade:** solicita uma unidade.
   - **Sem categoria:** solicita pelo menos uma categoria.
5. O gerente configura marcas, receita ou preços depois do cadastro.

**Fluxo C - Gerente gerencia marcas**

1. O gerente abre um produto com controle `Por marca`.
2. Clica em `Vincular marca`.
3. Informa nome, quantidade da embalagem, valor da embalagem e estoque inicial.
4. O sistema calcula preço unitário e atualiza o estoque total.
5. A primeira marca recebe automaticamente o chip `Principal`.
6. Para trocar a principal, o gerente usa o switch da nova marca.
7. Para excluir, abre o menu de ações e confirma o diálogo.
8. O sistema recalcula os dados dependentes.

**Fluxo D - Gerente ajusta estoque**

1. O gerente abre a aba Estoque.
2. Escolhe Entrada ou Baixa.
3. Se houver marca, escolhe o saldo da marca correspondente.
4. Seleciona Embalagens ou Unidade base.
5. Informa a quantidade.
6. O sistema exibe o total em gramas.
7. O sistema valida:
   - **Entrada válida:** soma ao saldo.
   - **Baixa válida:** subtrai do saldo.
   - **Baixa maior que o saldo:** bloqueia e informa a quantidade disponível.
8. O sistema recalcula situação e capacidade de produção.

**Fluxo E - Gerente monta receita**

1. O gerente abre um produto Fabricável e acessa Receita.
2. Define o rendimento de referência em gramas.
3. Adiciona um Ingrediente.
4. Seleciona a quantidade; a unidade é herdada.
5. Se o ingrediente for por marca, o sistema mostra a marca principal.
6. O sistema calcula custo, percentual do CMV, saldo e capacidade.
7. O gerente salva a linha.
8. O sistema atualiza CMV e quantidade máxima produzível.

**Fluxo F - Gerente ou funcionário registra produção**

1. O usuário autorizado clica em `Produzir`.
2. O sistema abre o modal com switch Lote/Quantidade.
3. O usuário informa lotes ou quantidade em gramas.
4. O sistema mostra o preview equivalente e a tabela de projeção.
5. Se algum ingrediente estiver insuficiente, a própria linha mostra necessário,
   disponível e faltante; confirmar fica bloqueado.
6. Se houver saldo suficiente, o usuário confirma.
7. O sistema baixa os ingredientes e adiciona o produto produzido na mesma
   transação.
8. Em sucesso, atualiza a página e fecha o modal.
9. Em falha, nenhuma alteração permanece.

**Fluxo G - Gerente configura acompanhamentos**

1. O gerente abre um produto Porção.
2. Acessa Acompanhamentos e clica em `Vincular acompanhamento`.
3. Seleciona produto, tipo, quantidade por porção e, quando aplicável, marca.
4. Configura o preço por produto + tamanho + acompanhamento na seção comercial.
5. O sistema exibe o custo previsto e salva o vínculo.
6. O acompanhamento fica disponível no PDV somente para os tamanhos ativos
   configurados.

**Fluxo H - Gerente altera unidade**

1. O gerente acessa Configurações e altera a unidade.
2. O sistema abre um diálogo de aviso.
3. O diálogo informa que marcas, receitas, tamanhos e operações dependentes usam
   a unidade do produto.
4. O gerente cancela ou confirma.
5. Se confirmar, o sistema salva a nova unidade conforme as regras de conversão
   vigentes e sinaliza valores que exigem revisão.

**Fluxo I - Gerente remove produto**

1. O gerente clica em `Remover`.
2. O sistema lista marcas, receita, tamanhos, acompanhamentos e configurações que
   serão apagados.
3. O gerente cancela ou confirma.
4. Ao confirmar, o sistema apaga o produto e seus dados dependentes.
5. Produtos e marcas de outros cadastros permanecem intactos.

---

### 4. Fora do Escopo (Out of Scope)

- PDV, carrinho, processamento de venda e histórico de pedidos.
- Modificadores de preço.
- Formas de pagamento, caixa, troco e conciliação.
- Valor total em estoque, lucro, margem e relatórios financeiros.
- Inventário físico.
- Lotes e validade.
- Perdas e desperdícios.
- Histórico de movimentações e auditoria de estoque.
- Notificações automáticas de estoque mínimo por email, SMS ou push.
- Ordens de compra e previsão de chegada.
- Marcas compartilhadas entre produtos.
- Múltiplas receitas para o mesmo produto Fabricável.
- Conversão automática entre g↔kg ou ml↔l.
- Multi-loja e múltiplas unidades operacionais.
- Autenticação, usuários, perfis e permissões.
- Billing, planos e assinaturas.
- Dashboard gerencial e BI.
- Composição automática de copos, tampas, colheres e descartáveis.
- Acompanhamentos em produtos de Revenda.
- Tipo `Base` como acompanhamento; a Porção já é a base do pedido.

#### Descartado durante a definição

- **Permitir estoque negativo:** removido; toda operação que deixaria o saldo
  negativo é bloqueada.
- **Valor em estoque no MRP:** removido; custos, lucros e movimentações
  financeiras pertencem a uma tela financeira.
- **Estoque físico, lotes e validade:** removidos do escopo desta versão.
- **Histórico e auditoria de estoque:** removidos do escopo; o módulo mantém
  somente os dados operacionais necessários para produzir.
- **Porção sem tamanho:** descartada; toda Porção vendável precisa de pelo menos
  um tamanho.
- **Acompanhamento obrigatório:** descartado; uma Porção pode ser vendida sem
  acompanhamento.
- **Marca fixa permanente na receita:** substituída pela marca principal vigente
  para baixas automáticas por marca.
- **Preço global de acompanhamento:** substituído pelo preço por produto +
  tamanho + acompanhamento.
- **Unidade visual misturada:** o design atual mantém quantidades de peso em
  gramas.
