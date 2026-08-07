### 1. Visão Geral

O módulo **Billing — Assinatura** permite que uma sorveteria experimente,
contrate e administre o acesso pago ao Scoops. O módulo controla o ciclo de
vida comercial da organização, integra cobranças recorrentes com o Asaas,
emite documentos fiscais e aplica bloqueios ou reativações conforme o estado
confirmado da assinatura.

Billing trata exclusivamente da mensalidade de uso do Scoops. Pagamentos feitos
pelos clientes da sorveteria, formas de pagamento do PDV, caixa, troco,
conciliação de vendas e emissão fiscal dos pedidos não pertencem a este módulo.

**Objetivo:** converter sorveterias que experimentam o Scoops em assinantes
pagantes por meio de uma oferta única, transparente e self-service, mantendo
previsibilidade em cobranças, cancelamentos, bloqueios e recuperação do acesso.

**Problema resolvido:** sem um módulo central de assinatura, o Scoops não possui
uma fonte confiável para determinar se uma sorveteria pode acessar os módulos
operacionais, nem oferece ao Gerente meios claros para contratar, atualizar o
pagamento, consultar cobranças, obter notas fiscais ou cancelar.

**Valor entregue:** teste sem compromisso, contratação simples, preço
previsível, cobrança recorrente por cartão ou Pix Automático, recuperação de
inadimplência sem perda imediata de dados e autonomia para administrar a
assinatura.

#### Oferta comercial confirmada

- **Plano:** `Scoops Completo`.
- **Preço:** R$ 59,90 por mês, com tributos incluídos.
- **Periodicidade:** exclusivamente mensal.
- **Abrangência:** todas as funcionalidades do Scoops.
- **Limites:** usuários, produtos, pedidos e movimentações ilimitados.
- **Taxas adicionais:** nenhuma taxa de implantação, adesão, cancelamento,
  usuário, volume ou forma de pagamento.
- **Teste:** 14 dias gratuitos, sem forma de pagamento antecipada e com acesso
  integral.
- **Formas de pagamento:** cartão de crédito e Pix Automático.
- **Provedor:** Asaas.

---

### 2. Público-alvo

#### Público principal

Gerentes de sorveterias e açaiterias independentes que precisam experimentar,
contratar e manter o acesso da organização ao Scoops sem depender de atendimento
comercial.

#### Públicos secundários

- Responsáveis financeiros ou contábeis que recebem comprovantes e NFS-e em um
  e-mail de faturamento, sem necessariamente possuir acesso ao Scoops.
- Assinantes pessoa física ou jurídica responsáveis pelo pagamento.
- Equipe administrativa do Scoops, que acompanha cobranças e exceções pelo
  painel do Asaas e por alertas técnicos.

#### Não público

- Operadores da sorveteria, que não podem visualizar preços, assinatura,
  cobranças ou dados fiscais.
- Redes que precisam contratar várias sorveterias em um único contrato.
- Clientes que exigem plano anual, preço negociado, add-ons ou faturamento por
  consumo.
- Clientes que buscam processar no Billing os pagamentos das vendas do PDV.

#### Contexto de uso

- Início do teste após a ativação da sorveteria e do primeiro Gerente.
- Contratação durante ou depois do teste.
- Renovação mensal por cartão ou Pix Automático.
- Atualização de dados fiscais ou da forma de pagamento.
- Recuperação de cartão recusado, saldo insuficiente, autorização revogada ou
  chargeback.
- Consulta de cobranças, comprovantes e NFS-e.
- Cancelamento, desistência do cancelamento, reembolso ou reativação.
- Exclusão manual ou automática após o período de retenção.

#### Dores e necessidades

- Conhecer o custo total antes de contratar.
- Testar todos os recursos sem cadastrar cartão.
- Evitar interrupção imediata por uma falha temporária de cobrança.
- Regularizar a assinatura sem perder cadastros ou históricos.
- Obter documentos financeiros e fiscais em um único lugar.
- Cancelar sem contato comercial ou obstáculos artificiais.
- Saber quando o acesso será bloqueado e quando os dados serão excluídos.
- Preservar a autoria das alterações realizadas por diferentes Gerentes.

#### Jobs to Be Done

- Quando eu criar minha sorveteria, quero testar todos os recursos sem informar
  uma forma de pagamento, para avaliar o Scoops sem risco de cobrança.
- Quando eu perceber valor durante o teste, quero assinar imediatamente, para
  transformar a sorveteria em cliente pagante.
- Quando uma cobrança falhar, quero saber o motivo e regularizar o pagamento,
  para evitar interrupção da operação.
- Quando meu cartão ou conta mudar, quero trocar a forma de pagamento, para
  manter as renovações automáticas.
- Quando eu precisar prestar contas, quero consultar comprovantes e NFS-e, para
  organizar a contabilidade.
- Quando eu decidir sair, quero cancelar a renovação sem perder o período já
  pago, para encerrar a contratação de forma previsível.
- Quando eu mudar de ideia após um bloqueio, quero pagar e recuperar todos os
  dados, para retomar a operação sem recadastro.

---

### 3. Análise do Cenário Competitivo

O mercado brasileiro combina quatro modelos relevantes: versão gratuita
limitada, teste temporário, múltiplos planos por recursos e contratação
assistida. A oportunidade do Scoops não está em reproduzir a amplitude de ERPs
generalistas, mas em oferecer uma assinatura simples para um produto vertical,
com preço único e sem limites comerciais que incentivem contas compartilhadas
ou interrompam a operação.

#### Matriz competitiva

| Solução | Público | Proposta de valor | Funcionalidades | Preço público | Limitações |
|---|---|---|---|---|---|
| [Consumer](https://www.consumer.com.br/) | Restaurantes, bares, lanchonetes, cafeterias e sorveterias | Operação de restaurantes em uma plataforma com entrada gratuita | PDV, pedidos, estoque, mesas, relatórios, fiscal, delivery e integrações | A página oficial informa versão gratuita até 200 pedidos/mês; a [loja oficial](https://loja.consumer.com.br/) informa plano Essencial por R$ 59,90/mês | A gratuidade termina pelo volume de pedidos; módulos e recursos variam entre planos |
| [Kyte](https://www.kyte.com.br/planos) | Pequenos comerciantes e equipes de venda | Gestão simples pelo celular e computador | PDV, estoque, catálogo, pedidos, relatórios, usuários e IA conforme o plano | A página oficial informa plano gratuito e planos pagos de R$ 49,90, R$ 69,90 e R$ 99,90 por mês | Quantidade de usuários, plataforma disponível e funcionalidades variam por nível |
| [Saipos](https://saipos.com/sistema/sorveteria) | Sorveterias e estabelecimentos de alimentação | Centralizar operação, estoque, financeiro, fiscal e delivery | PDV, balança, estoque, ficha técnica, relatórios, fiscal e integrações | A página oficial para sorveterias informa planos a partir de R$ 219,90/mês e teste grátis de sete dias | Contratação orientada por demonstração e oferta mais ampla do que o escopo inicial do Scoops |
| [Bling](https://www.bling.com.br/planos-e-precos) | Micro, pequenas e médias empresas multicanal | ERP integrado a vendas, estoque, fiscal, financeiro e logística | ERP, PDV, notas fiscais, integrações, financeiro, relatórios e limites por faixa | A [comunicação oficial de abril de 2026](https://ajuda.bling.com.br/hc/pt-br/articles/30224184866583-Altera%C3%A7%C3%A3o-nos-planos-e-pre%C3%A7os-do-Bling-em-abril-de-2025) informa planos mensais a partir de R$ 55 e teste inicial gratuito | Planos e faixas variam por recursos, usuários, armazenamento e pedidos importados |
| Planilha, lembrete e cobrança manual | Pequenas operações e softwares em validação | Baixo esforço técnico inicial | Registro manual de vencimentos, pagamentos e acessos | Variável | Não oferece renovação confiável, conciliação automática, auditoria ou bloqueio consistente |

#### Provedores de pagamento avaliados

- A documentação do [Asaas Checkout](https://docs.asaas.com/docs/checkout-asaas)
  informa checkout hospedado, cartão, Pix, assinaturas, callbacks, webhooks e
  Sandbox. O Asaas também documenta uma API específica para
  [Pix Automático](https://docs.asaas.com/reference/criar-uma-autorizacao-pix-automatico).
- A [AbacatePay](https://www.abacatepay.com/para/saas) informa assinaturas por
  cartão e Pix, taxas públicas e webhooks. Seu ciclo ampliado de assinaturas na
  API v2 foi publicado no [changelog de abril e maio de
  2026](https://docs.abacatepay.com/pages/changelog).
- A Appmax publica recursos de recorrência e recuperação de cobranças, mas não
  foi identificada documentação pública inequívoca de Pix Automático nas fontes
  consultadas.

#### Constatações e inferências

- Segundo as fontes oficiais, Consumer e Kyte reduzem a barreira de entrada com
  versões gratuitas, mas aplicam limites de volume, usuários ou recursos.
- Segundo a página oficial da Saipos, sua oferta para sorveterias custa mais e
  inclui uma superfície operacional maior.
- Segundo a documentação oficial do Bling, volume e recursos influenciam o
  enquadramento do plano.
- Inferência baseada nas fontes: o preço de R$ 59,90 posiciona o Scoops próximo
  à entrada de soluções generalistas, mas sua justificativa depende da
  especialização em produção, estoque e venda de sorvetes e açaí.
- Inferência baseada nas fontes: uma oferta única e ilimitada reduz a carga de
  comparação, protege a autoria individual e diferencia o Scoops de modelos com
  limites por usuário ou operação.

#### Diferenciais recomendados

- Um único plano com preço total explícito.
- Teste integral sem cartão e sem conversão automática inesperada.
- Nenhuma cobrança por usuário ou volume operacional.
- Cartão e Pix Automático como meios recorrentes equivalentes.
- Sete dias para recuperar falhas de pagamento antes do bloqueio.
- Reativação automática com preservação integral dos dados.
- Cancelamento self-service sem perda do período já pago.
- Histórico de cobranças, comprovantes e NFS-e dentro do produto.

---

### 4. Requisitos

#### REQ-01 Plano e Oferta Comercial

- [ ] **Plano e Oferta Comercial**

**Descrição:** O Scoops deve comercializar uma única assinatura mensal, com
preço e abrangência uniformes para todas as sorveterias.

##### Regras de Negócio

- **Plano:** o único plano deve se chamar `Scoops Completo`.
- **Preço:** a mensalidade deve ser de R$ 59,90, com tributos incluídos.
- **Periodicidade:** a cobrança deve ser mensal e não deve existir contratação
  anual no MVP.
- **Escopo:** o plano deve liberar todos os módulos e funcionalidades do Scoops.
- **Limites comerciais:** usuários, produtos, pedidos e movimentações não devem
  possuir limites comerciais.
- **Preço uniforme:** CPF e CNPJ devem pagar o mesmo valor.
- **Taxas:** não deve haver taxa adicional de implantação, adesão,
  cancelamento, usuário, volume ou forma de pagamento.
- **Reajuste:** um novo preço deve ser comunicado com pelo menos 30 dias de
  antecedência e aplicado somente a uma renovação posterior a esse prazo.
- **Dependência:** permissões funcionais de cada módulo continuam sendo
  determinadas pelos perfis do Identity.

##### Regras de UI/UX

- **Interface:** exibir nome do plano, valor mensal, funcionalidades incluídas e
  ausência de taxas adicionais em uma apresentação única, sem tabela de níveis.
- **Feedback:** qualquer reajuste deve mostrar valor atual, novo valor e data de
  vigência.
- **Estado vazio:** não aplicável, pois sempre existe uma oferta comercial.
- **Ação bloqueada:** não apresentar seleção anual, add-ons ou customização de
  limites.
- **Responsividade:** a oferta deve permanecer legível a partir de 320 px.
- **Acessibilidade:** preço, periodicidade e condições devem ser expostos como
  texto, não apenas por posição ou cor.

---

#### REQ-02 Teste Gratuito

- [ ] **Teste Gratuito**

**Descrição:** Uma sorveteria recém-ativada deve experimentar integralmente o
Scoops por 14 dias sem informar uma forma de pagamento.

##### Regras de Negócio

- **Início:** o teste deve começar quando a confirmação ativar conjuntamente a
  sorveteria e seu primeiro Gerente.
- **Duração:** o teste deve durar 14 dias corridos.
- **Acesso:** todos os módulos, funcionalidades e limites do plano pago devem
  estar disponíveis.
- **Sem pagamento:** cartão e Pix não devem ser exigidos para iniciar o teste.
- **Elegibilidade:** cada sorveteria e e-mail de primeiro Gerente devem receber
  somente um teste.
- **E-mail normalizado:** diferenças entre maiúsculas e minúsculas não devem
  gerar nova elegibilidade.
- **Recriação:** excluir e recriar uma conta com o mesmo e-mail não deve conceder
  novo teste.
- **Contratação antecipada:** pagamento confirmado durante o teste deve encerrar
  imediatamente os dias restantes e iniciar um ciclo mensal.
- **Falha inicial:** tentativa de contratação pendente ou recusada não deve
  encerrar o teste ainda válido.
- **Dependência:** o hash ou identificador necessário para impedir novo teste
  deve ser preservado sem reter a conta excluída para uso operacional.

##### Regras de UI/UX

- **Interface:** indicar estado `Em teste` e data de término na tela de
  Assinatura.
- **Feedback:** mostrar banner persistente somente aos Gerentes nos últimos sete
  dias, com dias restantes e ação `Assinar agora`.
- **Estado vazio:** não aplicável durante o teste.
- **Ação bloqueada:** Operadores não devem visualizar o banner ou a tela de
  Assinatura.
- **Responsividade:** o banner não deve cobrir navegação ou ações operacionais.
- **Acessibilidade:** o prazo deve possuir data textual e não depender somente
  de contagem regressiva visual.

---

#### REQ-03 Titular, Dados de Faturamento e Aceite

- [ ] **Titular, Dados de Faturamento e Aceite**

**Descrição:** A contratação deve identificar o titular, coletar os dados
necessários à cobrança e registrar aceite explícito das condições.

##### Regras de Negócio

- **Tipos de titular:** aceitar pessoa física com CPF e pessoa jurídica com
  CNPJ.
- **Dados obrigatórios:** nome ou razão social, CPF ou CNPJ, e-mail de
  faturamento, telefone e endereço completo.
- **E-mail financeiro:** pode ser diferente dos e-mails dos Gerentes e não deve
  criar acesso ao Scoops.
- **Validação:** CPF ou CNPJ, e-mail, telefone e endereço devem seguir os
  formatos aceitos pelo Asaas e pela emissão fiscal.
- **Sincronização:** o Scoops deve guardar uma cópia sincronizada dos dados
  necessários para exibição, reconciliação e NFS-e.
- **Alteração:** qualquer Gerente pode atualizar os dados; mudanças devem valer
  somente para cobranças e notas futuras.
- **Histórico fiscal:** documentos já emitidos não devem ser reescritos por uma
  alteração cadastral.
- **Aceite:** antes do checkout, o Gerente deve aceitar os Termos de Uso e a
  Política de Privacidade com preço, recorrência, cancelamento e retenção.
- **Evidência:** registrar versão dos documentos, usuário, data, hora e IP do
  aceite.

##### Regras de UI/UX

- **Interface:** agrupar dados do titular e endereço em uma seção de
  faturamento, distinguindo visualmente CPF de CNPJ.
- **Feedback:** validar campos antes do redirecionamento e preservar dados não
  sensíveis quando houver erro.
- **Estado vazio:** enquanto não houver contratação, informar que os dados serão
  solicitados no checkout.
- **Ação bloqueada:** impedir contratação sem dados válidos e aceite explícito.
- **Responsividade:** formulários devem usar teclado apropriado e não exigir
  rolagem horizontal.
- **Acessibilidade:** campos devem possuir labels, instruções, associação de
  erros e foco visível.

---

#### REQ-04 Checkout e Formas de Pagamento

- [ ] **Checkout e Formas de Pagamento**

**Descrição:** O Gerente deve contratar o plano por um checkout hospedado pelo
Asaas usando cartão de crédito ou Pix Automático.

##### Regras de Negócio

- **Provedor:** o Asaas deve ser o único provedor do MVP.
- **Checkout:** o Scoops deve criar uma sessão hospedada e redirecionar o
  Gerente para concluir o pagamento.
- **Cartão:** a renovação deve cobrar automaticamente o cartão tokenizado pelo
  Asaas.
- **Pix:** a recorrência deve utilizar Pix Automático com autorização única do
  pagador; Pix manual mensal não atende à regra confirmada.
- **Primeira cobrança:** contratar durante o teste deve cobrar imediatamente R$
  59,90.
- **Ativação:** somente confirmação financeira recebida e validada deve ativar
  o plano; a URL de retorno não é comprovação de pagamento.
- **Segurança:** o Scoops não deve receber nem armazenar número completo,
  código de segurança ou credenciais bancárias.
- **Referência:** checkout, cliente, assinatura e cobrança no Asaas devem usar
  referências correlacionáveis à sorveteria.
- **Dependência:** Pix Automático deve ser homologado na conta Asaas antes do
  lançamento.

##### Regras de UI/UX

- **Interface:** apresentar resumo final e ação `Ir para pagamento`; o Asaas
  coleta os dados sensíveis.
- **Feedback:** após o retorno, mostrar `Pagamento confirmado`, `Processando
  pagamento`, `Pagamento recusado`, `Checkout cancelado` ou `Checkout expirado`.
- **Estado vazio:** sem checkout iniciado, exibir as formas disponíveis e o
  preço total.
- **Ação bloqueada:** impedir sessões duplicadas enquanto já existir tentativa
  válida em processamento.
- **Responsividade:** o retorno do checkout deve preservar o contexto em celular
  e computador.
- **Acessibilidade:** mensagens de retorno devem receber foco e ser anunciadas
  por tecnologia assistiva.

---

#### REQ-05 Estados da Assinatura e Controle de Acesso

- [ ] **Estados da Assinatura e Controle de Acesso**

**Descrição:** O sistema deve manter um estado local auditável da assinatura e
aplicar acesso consistente em todas as rotas e ações protegidas.

##### Regras de Negócio

| Estado | Significado | Acesso operacional |
|---|---|---|
| `Em teste` | Teste de 14 dias vigente | Integral |
| `Pagamento inicial pendente` | Checkout concluído sem confirmação final | Integral se o teste ainda estiver válido; bloqueado caso contrário |
| `Ativa` | Período pago confirmado | Integral |
| `Em tolerância` | Renovação falhou ou houve chargeback há no máximo sete dias | Integral |
| `Cancelamento agendado` | Renovação cancelada, período pago ainda vigente | Integral até a data final |
| `Bloqueada` | Teste terminou, tolerância expirou, período cancelado terminou ou houve reembolso | Somente Assinatura e Minha conta |
| `Exclusão agendada` | Bloqueio alcançou a retenção de 90 dias | Somente Assinatura e Minha conta até a exclusão |
| `Excluída` | Dados operacionais removidos | Nenhum |

- **Fonte de verdade financeira:** eventos e consultas autenticadas ao Asaas
  determinam pagamentos; o Scoops determina o acesso a partir do estado
  reconciliado.
- **Autorização:** toda rota e operação protegida deve validar o estado, sem
  depender apenas da interface.
- **Escopo bloqueado:** uma sorveteria bloqueada só pode acessar Assinatura,
  Minha conta, Sair e a zona de perigo para exclusão.
- **Preservação:** bloquear não deve alterar ou apagar dados operacionais.
- **Tempo de aplicação:** o novo estado deve afetar o acesso em até 60 segundos
  após o recebimento de um webhook válido.
- **Sessões:** mudança para bloqueado deve retirar acesso operacional inclusive
  de sessões já abertas.
- **Reativação:** pagamento confirmado durante os 90 dias deve restaurar
  automaticamente o acesso integral sem alterar dados.

##### Regras de UI/UX

- **Interface:** a tela de Assinatura deve exibir estado, período, próxima ação
  e datas relevantes.
- **Feedback:** durante os 60 segundos, mostrar `Processando pagamento` e
  permitir atualizar a consulta sem duplicar cobranças.
- **Estado vazio:** se não houver assinatura após o teste, apresentar a oferta e
  ação de contratação.
- **Ação bloqueada:** ao tentar abrir módulo operacional, explicar o motivo e
  direcionar Gerentes para Assinatura; Operadores recebem orientação para
  procurar um Gerente.
- **Responsividade:** o bloqueio deve manter saída e recuperação acessíveis em
  telas pequenas.
- **Acessibilidade:** estado, causa e solução devem ser textuais e não depender
  apenas de cor.

---

#### REQ-06 Renovação, Falha de Cobrança e Tolerância

- [ ] **Renovação, Falha de Cobrança e Tolerância**

**Descrição:** A assinatura deve renovar mensalmente e oferecer sete dias para
regularizar falhas antes de bloquear a operação.

##### Regras de Negócio

- **Renovação:** a data inicial do primeiro pagamento confirmado deve definir o
  ciclo mensal conforme as regras de calendário do Asaas.
- **Sucesso:** uma renovação paga deve estender o período ativo e gerar nova
  cobrança no histórico.
- **Falha:** cartão recusado, saldo insuficiente, autorização Pix inválida ou
  cobrança não liquidada devem iniciar `Em tolerância`.
- **Prazo:** a tolerância deve durar sete dias corridos a partir da falha.
- **Acesso:** todos os módulos permanecem disponíveis durante a tolerância.
- **Retentativas:** o sistema deve usar as retentativas suportadas pelo Asaas e
  permitir ação manual segura para regularização.
- **Quitação:** pagamento confirmado encerra a tolerância e restaura `Ativa`.
- **Expiração:** sem pagamento, o estado deve mudar para `Bloqueada` ao fim do
  prazo.
- **Idempotência:** eventos repetidos não podem estender período, duplicar
  cobrança ou alternar estados incorretamente.

##### Regras de UI/UX

- **Interface:** exibir alerta com motivo apresentável, prazo restante e ações
  `Pagar agora` e `Alterar forma de pagamento`.
- **Feedback:** confirmar cada tentativa sem afirmar sucesso antes do webhook.
- **Estado vazio:** não aplicável à tolerância.
- **Ação bloqueada:** se o provedor estiver indisponível, manter último estado e
  informar que a regularização está temporariamente indisponível.
- **Responsividade:** alertas devem priorizar prazo e ação em telas pequenas.
- **Acessibilidade:** o alerta deve ser anunciado e manter foco na ação
  principal sem bloquear a navegação operacional.

---

#### REQ-07 Alteração da Forma de Pagamento

- [ ] **Alteração da Forma de Pagamento**

**Descrição:** Qualquer Gerente deve alternar entre cartão e Pix Automático sem
expor dados financeiros sensíveis.

##### Regras de Negócio

- **Autorização:** somente Gerentes podem iniciar a alteração.
- **Modalidades:** permitir cartão para cartão, cartão para Pix Automático, Pix
  para cartão e nova autorização Pix.
- **Assinatura regular:** a nova modalidade deve valer para a próxima renovação.
- **Inadimplência:** durante tolerância ou bloqueio, a nova modalidade deve
  tentar quitar a mensalidade pendente.
- **Confirmação:** não substituir a modalidade ativa antes da confirmação do
  Asaas.
- **Revogação:** cancelar uma autorização Pix no banco deve ser refletido na
  próxima sincronização.
- **Cartão exibido:** armazenar e exibir somente bandeira, quatro últimos dígitos
  e validade quando fornecidos pelo provedor.
- **Falha:** uma alteração recusada deve preservar a modalidade anterior quando
  ela ainda for válida.

##### Regras de UI/UX

- **Interface:** mostrar modalidade atual mascarada e ação `Alterar forma de
  pagamento`, com redirecionamento seguro ao Asaas.
- **Feedback:** diferenciar autorização pendente, concluída, recusada, cancelada
  e expirada.
- **Estado vazio:** sem modalidade ativa, orientar contratação ou regularização.
- **Ação bloqueada:** impedir alteração paralela enquanto existir uma tentativa
  pendente.
- **Responsividade:** cartões e ações devem empilhar sem truncar informações
  essenciais.
- **Acessibilidade:** a modalidade mascarada deve possuir descrição acessível e
  nunca depender apenas do ícone da bandeira.

---

#### REQ-08 Cancelamento e Retomada da Renovação

- [ ] **Cancelamento e Retomada da Renovação**

**Descrição:** Qualquer Gerente deve cancelar a próxima renovação sem perder o
período já pago e desfazer o cancelamento antes da data final.

##### Regras de Negócio

- **Autorização:** qualquer Gerente pode cancelar; Operadores não visualizam a
  ação.
- **Efeito:** o cancelamento deve impedir cobranças futuras e manter acesso até
  o fim do ciclo vigente.
- **Reembolso proporcional:** não deve existir no cancelamento comum.
- **Confirmação:** exigir uma única confirmação com consequências e data final.
- **Motivo:** pode ser coletado opcionalmente e nunca deve impedir a ação.
- **Retomada:** `Manter assinatura` antes da data final deve remover o
  cancelamento agendado sem cobrança imediata.
- **Vencimento:** ao fim do ciclo cancelado, mudar para `Bloqueada` e iniciar a
  retenção de 90 dias.
- **Exclusão da sorveteria:** permanece uma ação distinta; deve cancelar a
  assinatura antes da remoção imediata dos dados operacionais.
- **Falha do Asaas:** não apresentar cancelamento como concluído até confirmação
  do provedor.

##### Regras de UI/UX

- **Interface:** separar `Cancelar assinatura` da zona de perigo `Excluir
  sorveteria` e explicar a diferença.
- **Feedback:** após cancelar, mostrar data final e ação `Manter assinatura`.
- **Estado vazio:** não mostrar cancelamento quando não houver assinatura ativa.
- **Ação bloqueada:** falha no provedor deve manter o estado anterior e oferecer
  nova tentativa.
- **Responsividade:** confirmação e consequências devem permanecer legíveis em
  320 px.
- **Acessibilidade:** foco deve permanecer dentro da confirmação e retornar à
  ação originária ao cancelar o diálogo.

---

#### REQ-09 Reembolso e Chargeback

- [ ] **Reembolso e Chargeback**

**Descrição:** O Billing deve permitir desistência da primeira mensalidade e
tratar contestações posteriores sem estados financeiros ambíguos.

##### Regras de Negócio

- **Elegibilidade:** somente a primeira mensalidade pode receber reembolso
  integral por desistência em até sete dias após o pagamento.
- **Canal:** qualquer Gerente deve conseguir solicitar o reembolso pela tela de
  Assinatura.
- **Processamento:** o reembolso deve usar o meio e as regras suportadas pelo
  Asaas.
- **Acesso:** a confirmação do reembolso deve bloquear imediatamente os módulos
  operacionais e iniciar retenção de 90 dias.
- **Novo teste:** recontratar depois do reembolso não deve conceder novo teste.
- **Renovações:** não possuem reembolso proporcional, salvo cobrança indevida ou
  obrigação legal.
- **Cobrança indevida:** deve seguir o tratamento legal e operacional aplicável,
  sem ser limitada pela regra de primeira mensalidade.
- **Chargeback:** uma contestação confirmada deve iniciar sete dias de tolerância
  para novo pagamento.
- **Regularização:** pagamento dentro do prazo mantém ou restaura `Ativa`.
- **Falha:** sem regularização, o chargeback deve resultar em `Bloqueada`.
- **Fiscal:** reembolso deve disparar cancelamento ou ajuste da NFS-e conforme a
  regra fiscal aplicável.

##### Regras de UI/UX

- **Interface:** durante a elegibilidade, apresentar `Cancelar e solicitar
  reembolso`, com valor, prazo e efeito imediato no acesso.
- **Feedback:** diferenciar solicitação enviada, reembolso processando,
  confirmado e recusado.
- **Estado vazio:** após sete dias, retirar a ação de arrependimento e manter o
  cancelamento comum.
- **Ação bloqueada:** impedir pedidos duplicados enquanto existir reembolso em
  processamento.
- **Responsividade:** consequências devem aparecer antes da confirmação final.
- **Acessibilidade:** a gravidade do bloqueio não deve ser comunicada apenas por
  cor.

---

#### REQ-10 Cobranças, Comprovantes e Histórico

- [ ] **Cobranças, Comprovantes e Histórico**

**Descrição:** Gerentes devem consultar o histórico financeiro da sorveteria sem
acesso ao painel do provedor.

##### Regras de Negócio

- **Campos:** cada cobrança deve preservar competência, vencimento, pagamento,
  valor, modalidade, status, identificador interno e identificador do Asaas.
- **Status:** suportar ao menos pendente, paga, falhou, vencida, reembolsada e
  contestada.
- **Comprovante:** disponibilizar recibo ou comprovante fornecido pelo Asaas
  quando existente.
- **NFS-e:** vincular a nota correspondente à cobrança paga.
- **Imutabilidade:** registros concluídos não devem ser sobrescritos por estados
  futuros; alterações devem produzir eventos ou transições auditáveis.
- **Ordenação:** apresentar cobranças da mais recente para a mais antiga.
- **Acesso:** qualquer Gerente pode consultar; Operadores não podem acessar.
- **Mascaramento:** nunca mostrar cartão completo ou dados bancários.

##### Regras de UI/UX

- **Interface:** usar tabela no desktop e linhas ou cards compactos no celular,
  com detalhe expansível.
- **Feedback:** indicar carregamento, falha de consulta e atualização recente.
- **Estado vazio:** antes da primeira cobrança, explicar que o histórico será
  exibido após a contratação.
- **Ação bloqueada:** comprovante ou nota indisponível deve mostrar o motivo e o
  estado, não um link quebrado.
- **Responsividade:** preservar valor, data e status como informações
  prioritárias.
- **Acessibilidade:** headers, linhas e ações devem manter semântica de tabela ou
  lista e nomes acessíveis.

---

#### REQ-11 Emissão e Entrega de NFS-e

- [ ] **Emissão e Entrega de NFS-e**

**Descrição:** Cada mensalidade paga deve gerar uma NFS-e com os dados fiscais
vigentes na competência.

##### Regras de Negócio

- **Gatilho:** emitir somente após confirmação do pagamento.
- **Titular:** usar os dados de faturamento vigentes no momento da cobrança.
- **Entrega:** enviar ao e-mail de faturamento e disponibilizar no histórico.
- **Falha:** uma indisponibilidade fiscal não deve bloquear ou suspender uma
  assinatura paga.
- **Estado pendente:** registrar falha, repetir automaticamente e alertar a
  operação administrativa do Scoops.
- **Idempotência:** uma cobrança não pode gerar notas duplicadas por repetição de
  evento.
- **Correção:** dados cadastrais novos valem somente para notas futuras;
  correções retroativas seguem processo excepcional e regra fiscal.
- **Reembolso:** cancelar ou ajustar a nota conforme permitido pela autoridade
  municipal.
- **Dependência:** município, certificado, código de serviço, alíquota e regime
  tributário do Scoops devem ser configurados e homologados fora da interface do
  cliente.

##### Regras de UI/UX

- **Interface:** exibir número, competência, status e ação `Baixar NFS-e`.
- **Feedback:** usar estados `Emitindo`, `Emitida`, `Falha temporária`,
  `Cancelada` ou equivalente.
- **Estado vazio:** cobrança não paga não deve sugerir que uma nota já existe.
- **Ação bloqueada:** em falha, substituir download por explicação e informar
  que o acesso permanece ativo.
- **Responsividade:** número e ação podem empilhar, sem perder associação com a
  cobrança.
- **Acessibilidade:** links de notas devem incluir competência ou número no nome
  acessível.

---

#### REQ-12 Notificações de Billing

- [ ] **Notificações de Billing**

**Descrição:** O Scoops deve avisar os Gerentes e o contato financeiro sobre
eventos que exigem conhecimento ou ação.

##### Regras de Negócio

- **Canais:** usar e-mail e aviso dentro do produto; SMS e WhatsApp não pertencem
  ao MVP.
- **Gerentes:** fim de teste, falha de cobrança, bloqueio, cancelamento,
  reativação, reajuste e exclusão devem ser enviados a todos os Gerentes ativos.
- **E-mail financeiro:** comprovantes, NFS-e e comunicações de cobrança devem ser
  enviados ao endereço de faturamento.
- **Fim do teste:** notificar 7, 3 e 1 dia antes.
- **Inadimplência:** notificar imediatamente e nos dias 3 e 6 da tolerância.
- **Bloqueio:** notificar quando ocorrer.
- **Exclusão automática:** notificar 30, 7 e 1 dia antes.
- **Reajuste:** notificar pelo menos 30 dias antes da vigência.
- **Duplicidade:** a mesma ocorrência e marco não devem gerar mensagens
  repetidas por webhooks duplicados.
- **Auditoria:** registrar tentativa e resultado do envio.

##### Regras de UI/UX

- **Interface:** avisos dentro do produto devem mostrar causa, prazo e ação
  recomendada.
- **Feedback:** links de e-mail devem abrir o contexto correto após autenticação.
- **Estado vazio:** ausência de alertas não exige uma central de notificações no
  MVP.
- **Ação bloqueada:** destinatário inválido deve gerar alerta operacional sem
  expor dados a outros clientes.
- **Responsividade:** banners devem permitir leitura e fechamento sem cobrir
  conteúdo essencial.
- **Acessibilidade:** alertas críticos devem usar ícone, texto e semântica
  apropriada, não apenas cor.

---

#### REQ-13 Retenção, Reativação e Exclusão Automática

- [ ] **Retenção, Reativação e Exclusão Automática**

**Descrição:** Dados operacionais de uma sorveteria bloqueada devem permanecer
recuperáveis por 90 dias e ser excluídos de forma segura ao fim do prazo.

##### Regras de Negócio

- **Início:** teste expirado, tolerância vencida, término do período cancelado ou
  reembolso confirmado devem iniciar retenção de 90 dias.
- **Preservação:** usuários, produtos, estoque, pedidos, configurações e
  históricos não devem ser alterados durante a retenção.
- **Reativação:** pagamento confirmado deve cancelar a exclusão agendada e
  restaurar acesso integral.
- **Exclusão:** ao fim de 90 dias, cancelar qualquer recorrência remanescente no
  Asaas antes de remover os dados operacionais.
- **Falha do provedor:** se o cancelamento não for confirmado, manter a
  sorveteria bloqueada, preservar os dados, alertar a operação e repetir a ação.
- **Sem acesso gratuito:** falha do Asaas não pode reativar módulos operacionais.
- **Backups:** dados excluídos podem persistir somente em backups criptografados
  por até 30 dias.
- **Restauração:** restaurar um backup deve reaplicar exclusões registradas antes
  de devolver o ambiente à operação.
- **Exclusão manual:** a zona de perigo do Identity continua permitindo remoção
  imediata, condicionada ao cancelamento bem-sucedido da assinatura.
- **Exportação:** não deve existir exportação operacional durante o bloqueio no
  MVP.

##### Regras de UI/UX

- **Interface:** apresentar data da exclusão e ação de reativação durante os 90
  dias.
- **Feedback:** pagamento deve remover a contagem somente após confirmação.
- **Estado vazio:** não aplicável enquanto os dados estão retidos.
- **Ação bloqueada:** se o provedor impedir a exclusão, não oferecer acesso
  operacional e não afirmar que os dados foram removidos.
- **Responsividade:** prazo, consequências e contratação devem estar visíveis em
  celular.
- **Acessibilidade:** contagem deve incluir a data exata e não depender apenas de
  um indicador visual.

---

#### REQ-14 Arquivo Fiscal e Privacidade

- [ ] **Arquivo Fiscal e Privacidade**

**Descrição:** A exclusão da sorveteria deve remover dados operacionais, mas
preservar separadamente o mínimo fiscal exigido por obrigação legal.

##### Regras de Negócio

- **Prazo:** conservar registros fiscais mínimos por cinco anos após emissão ou
  conforme prazo legal superior que venha a ser aplicável.
- **Conteúdo:** NFS-e e seus identificadores, titular e CPF/CNPJ, valor,
  competência, datas, identificadores de cobrança e transação, modalidade e
  registros de cancelamento, reembolso ou chargeback.
- **Exclusões:** produtos, estoque, pedidos, usuários da equipe, senhas, sessões
  e auditorias operacionais não pertencem ao arquivo fiscal.
- **Segregação:** o arquivo deve permanecer separado do banco operacional e não
  pode reativar a sorveteria.
- **Finalidade:** usar somente para obrigações fiscais, contábeis, legais e
  defesa de direitos; uso comercial ou de marketing é proibido.
- **Acesso:** limitar à operação contábil ou jurídica autorizada do Scoops e
  registrar consultas.
- **Descarte:** excluir de forma segura ao fim do prazo aplicável, salvo nova
  obrigação legal ou litígio documentado.
- **Dependência:** o PRD de Identity deve ser corrigido, pois sua promessa de
  exclusão de todos os dados contradiz esta exceção legal.

##### Regras de UI/UX

- **Interface:** antes da exclusão, informar que registros fiscais mínimos serão
  preservados pelo prazo legal e permanecerão indisponíveis no produto.
- **Feedback:** a conclusão deve distinguir dados operacionais excluídos de
  registros fiscais retidos.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** nenhum usuário excluído pode acessar o arquivo fiscal pelo
  Scoops.
- **Responsividade:** a explicação legal deve permanecer legível em telas
  pequenas.
- **Acessibilidade:** o aviso deve usar linguagem direta e ser anunciado antes
  da confirmação destrutiva.

---

#### REQ-15 Permissões e Auditoria

- [ ] **Permissões e Auditoria**

**Descrição:** Billing deve respeitar os perfis fixos do Identity e preservar a
autoria das ações administrativas.

##### Regras de Negócio

- **Gerentes:** qualquer Gerente pode visualizar, contratar, alterar dados e
  pagamento, cancelar, retomar, reembolsar e reativar.
- **Operadores:** não podem visualizar a navegação `Assinatura`, preços,
  cobranças, documentos ou ações.
- **Auditoria:** registrar contratação, aceite, alteração cadastral, alteração de
  pagamento, cancelamento, retomada, reativação e pedido de reembolso.
- **Detalhes:** preservar ação, responsável, momento, estado anterior, novo
  estado e identificadores técnicos relevantes.
- **Eventos automáticos:** registrar também renovação, falha, bloqueio, exclusão
  agendada e reconciliação como ações do sistema.
- **Dados sensíveis:** logs e auditoria não podem conter cartão completo, código
  de segurança, credenciais ou dados bancários.
- **Isolamento:** toda consulta e mutação deve estar limitada à sorveteria do
  usuário autenticado.

##### Regras de UI/UX

- **Interface:** eventos relevantes devem aparecer na auditoria administrativa
  existente com ator `Sistema` ou nome do Gerente.
- **Feedback:** ações do Gerente devem confirmar resultado e informar quando
  ainda aguardam o provedor.
- **Estado vazio:** mostrar o evento inicial da assinatura ou do teste como
  primeiro registro.
- **Ação bloqueada:** Operadores não devem ver links ou estados financeiros.
- **Responsividade:** a linha do tempo deve priorizar ação, responsável e data.
- **Acessibilidade:** eventos devem possuir descrições textuais compreensíveis,
  não somente códigos de status.

---

#### REQ-16 Integração, Confiabilidade e Segurança

- [ ] **Integração, Confiabilidade e Segurança**

**Descrição:** A integração com o Asaas deve tolerar eventos repetidos, atrasos
e indisponibilidade sem cobranças duplicadas ou bloqueios indevidos.

##### Regras de Negócio

- **Webhooks:** validar autenticidade, origem e estrutura antes do processamento.
- **Idempotência:** usar identificadores do evento e da operação para impedir
  efeitos duplicados.
- **Processamento:** responder rapidamente ao provedor e executar mudanças
  internas de forma assíncrona e observável.
- **Reconciliação:** consultar periodicamente assinaturas e cobranças pendentes
  para recuperar eventos perdidos ou divergentes.
- **Indisponibilidade:** preservar o último estado confirmado; uma sorveteria
  ativa não pode ser bloqueada apenas porque o Asaas está indisponível.
- **Operações pendentes:** checkout, alteração, cancelamento ou reembolso sem
  confirmação devem permanecer pendentes, nunca presumidos como concluídos.
- **Alertas:** falhas persistentes, divergências, emissão fiscal pendente e
  exclusão impedida devem alertar a operação do Scoops.
- **Segredos:** credenciais do Asaas devem permanecer fora do cliente, com
  rotação e acesso mínimo.
- **Ambientes:** usar contas e chaves separadas para Sandbox e produção.
- **Dados:** criptografar dados de faturamento em trânsito e em repouso.
- **Backoffice:** não construir painel financeiro interno; usar o painel do
  Asaas e logs técnicos correlacionados.

##### Regras de UI/UX

- **Interface:** estados pendentes devem informar que a confirmação pode levar
  alguns instantes e permitir nova consulta.
- **Feedback:** erros técnicos devem ter mensagem segura, identificador de
  suporte e ação possível.
- **Estado vazio:** indisponibilidade não deve apagar informações já
  sincronizadas.
- **Ação bloqueada:** impedir repetição de operação enquanto uma solicitação
  idempotente estiver em andamento.
- **Responsividade:** estados de contingência devem funcionar em todos os
  dispositivos suportados.
- **Acessibilidade:** atualizações assíncronas devem ser anunciadas sem mover o
  foco inesperadamente.

---

#### REQ-17 Navegação, Responsividade e Acessibilidade

- [ ] **Navegação, Responsividade e Acessibilidade**

**Descrição:** A tela de Assinatura deve concentrar oferta, estado, pagamento,
faturamento, histórico e cancelamento em uma experiência coerente.

##### Regras de Negócio

- **Navegação:** `Assinatura` deve permanecer no footer administrativo da
  sidebar e estar disponível somente para Gerentes.
- **Seções:** apresentar resumo do plano, estado atual, próxima cobrança, forma
  de pagamento, dados de faturamento, histórico e cancelamento conforme o
  estado.
- **Ações contextuais:** exibir somente ações válidas para o estado atual.
- **Bloqueio:** Assinatura e Minha conta devem continuar alcançáveis quando os
  demais módulos estiverem bloqueados.
- **Acessibilidade:** cumprir WCAG 2.2 nível AA.
- **Responsividade:** todos os fluxos devem funcionar a partir de 320 px.
- **Internacionalização:** moeda e datas devem usar formato brasileiro; regras
  de calendário financeiro seguem o provedor.

##### Regras de UI/UX

- **Interface:** seguir o design system do Scoops, com números protagonistas,
  superfícies neutras, roxo em ações primárias e cores semânticas para estados.
- **Feedback:** oferecer estados de carregamento, sucesso, erro, processamento,
  vazio e bloqueio em cada seção assíncrona.
- **Estado vazio:** orientar a próxima ação sem apresentar tabelas ou cards
  vazios sem explicação.
- **Ação bloqueada:** explicar motivo, consequência e correção; não usar botões
  desabilitados sem texto de apoio.
- **Responsividade:** tabelas devem se adaptar para listas ou cards; ações
  primárias permanecem visíveis sem rolagem horizontal.
- **Acessibilidade:** garantir teclado, foco visível, labels, erros anunciados,
  contraste AA e estados que não dependam somente de cor.

---

#### REQ-18 Métricas e Instrumentação

- [ ] **Métricas e Instrumentação**

**Descrição:** O Billing deve instrumentar o funil de teste e assinatura para
avaliar conversão, inadimplência e retenção.

##### Regras de Negócio

- **Métrica principal:** taxa de sorveterias que iniciam o teste e se tornam
  pagantes até 30 dias após seu término.
- **Meta inicial:** conversão mínima de 20%, tratada como hipótese até existir
  base histórica suficiente.
- **Eventos mínimos:** teste iniciado, aviso exibido, checkout iniciado,
  checkout abandonado, pagamento confirmado, pagamento falhou, assinatura
  cancelada, cancelamento desfeito, bloqueio, reativação, reembolso e exclusão.
- **Métricas secundárias:** MRR, conversão durante o teste, tempo até contratação,
  falha de renovação, recuperação na tolerância, churn voluntário, churn
  involuntário e uso de cartão versus Pix.
- **Privacidade:** eventos analíticos não devem conter CPF/CNPJ completo, e-mail,
  cartão ou dados bancários.
- **Consistência:** métricas financeiras devem reconciliar com cobranças
  confirmadas, não apenas eventos de interface.

##### Regras de UI/UX

- **Interface:** não é necessário dashboard de métricas dentro do Billing no
  MVP.
- **Feedback:** instrumentação não deve bloquear ou atrasar ações do usuário.
- **Estado vazio:** não aplicável à interface do cliente.
- **Ação bloqueada:** falha analítica não deve impedir contratação ou
  pagamento.
- **Responsividade:** não aplicável à coleta em segundo plano.
- **Acessibilidade:** instrumentação não pode interferir com foco, leitura ou
  navegação assistiva.

---

### 5. Fluxo de Usuário (User Flow)

#### Fluxo A - Iniciar teste gratuito

1. O primeiro Gerente confirma a conta criada no onboarding.
2. O sistema ativa a sorveteria e inicia 14 dias de teste integral.
3. O Billing registra a elegibilidade usada para a sorveteria e o e-mail.
4. O Gerente acessa todos os módulos sem informar forma de pagamento.
5. Nos últimos sete dias, o sistema apresenta o banner de prazo.
6. O fluxo termina com teste vigente, contratação ou expiração.

#### Fluxo B - Contratar durante o teste

1. O Gerente seleciona `Assinar agora`.
2. O sistema apresenta `Scoops Completo`, R$ 59,90/mês e as condições.
3. O Gerente informa dados de faturamento e aceita os documentos vigentes.
4. O sistema cria o checkout Asaas e redireciona o Gerente.
5. O Gerente escolhe cartão ou autoriza Pix Automático.
6. O Asaas processa o primeiro pagamento:
   - Sucesso: o webhook confirma o pagamento, encerra o teste e inicia o ciclo
     mensal na data da confirmação.
   - Pendente: o Scoops mantém o teste válido e mostra `Processando pagamento`.
   - Falha ou cancelamento: o teste permanece até sua data original.
7. O sistema emite NFS-e e registra a cobrança.

#### Fluxo C - Contratar após o teste expirado

1. O Gerente entra no Scoops bloqueado.
2. O sistema permite somente Assinatura, Minha conta, Sair e exclusão.
3. O Gerente seleciona o plano e conclui o checkout.
4. Enquanto o pagamento está pendente, o bloqueio permanece.
5. Após confirmação, o sistema reativa todos os módulos em até 60 segundos.
6. Todos os dados anteriores permanecem intactos.

#### Fluxo D - Renovar com sucesso

1. O Asaas executa a cobrança mensal na data prevista.
2. Cartão ou Pix Automático confirma o pagamento.
3. O webhook informa a cobrança ao Scoops.
4. O sistema processa o evento uma única vez, estende o período ativo e registra
   o histórico.
5. O sistema emite NFS-e e envia os documentos ao e-mail financeiro.

#### Fluxo E - Recuperar falha de renovação

1. A renovação falha.
2. O sistema muda a assinatura para `Em tolerância` por sete dias.
3. Todos os Gerentes recebem aviso imediato; novos avisos ocorrem nos dias 3 e
   6.
4. O Gerente paga novamente ou altera a forma de pagamento:
   - Sucesso: a assinatura retorna a `Ativa`.
   - Pendente: o acesso integral permanece até o fim da tolerância.
   - Falha: o prazo original continua, sem ser reiniciado.
5. Sem pagamento após sete dias, os módulos operacionais são bloqueados.

#### Fluxo F - Alterar forma de pagamento

1. O Gerente abre Assinatura e seleciona `Alterar forma de pagamento`.
2. O Scoops inicia o fluxo seguro do Asaas.
3. O Gerente cadastra outro cartão ou autoriza Pix Automático.
4. O Asaas confirma a alteração:
   - Assinatura regular: a nova modalidade vale na próxima renovação.
   - Inadimplente: o sistema tenta quitar a cobrança pendente.
   - Falha: a modalidade anterior válida é preservada.
5. O Billing registra a alteração na auditoria.

#### Fluxo G - Cancelar e desfazer cancelamento

1. O Gerente seleciona `Cancelar assinatura`.
2. O sistema mostra data final de acesso, retenção de 90 dias e diferença para
   exclusão da sorveteria.
3. O Gerente pode informar um motivo e confirma uma vez.
4. Após confirmação do Asaas, o estado muda para `Cancelamento agendado`.
5. Até a data final, o Gerente pode selecionar `Manter assinatura`:
   - Sucesso: a renovação original é restaurada sem cobrança imediata.
   - Sem retomada: o período termina, a sorveteria é bloqueada e começa a
     retenção.

#### Fluxo H - Solicitar reembolso da primeira mensalidade

1. Durante os sete dias posteriores ao primeiro pagamento, o Gerente seleciona
   `Cancelar e solicitar reembolso`.
2. O sistema mostra o valor integral e o bloqueio imediato após confirmação.
3. O Gerente confirma.
4. O Asaas processa o reembolso:
   - Sucesso: o acesso é bloqueado, começa a retenção de 90 dias e a NFS-e é
     cancelada ou ajustada.
   - Pendente: o estado e a ação ficam em processamento.
   - Falha: o acesso e a assinatura anteriores são preservados.
5. Uma futura contratação não concede novo teste.

#### Fluxo I - Tratar chargeback

1. O Asaas informa que uma cobrança paga foi contestada e revertida.
2. O sistema inicia tolerância de sete dias e avisa todos os Gerentes.
3. O Gerente informa nova forma de pagamento ou paga novamente.
4. O sistema valida:
   - Sucesso: retorna a `Ativa`.
   - Falha ou ausência de ação: bloqueia ao fim do prazo.
5. O histórico preserva pagamento original, contestação e regularização.

#### Fluxo J - Consultar histórico e NFS-e

1. O Gerente abre Assinatura.
2. O sistema apresenta as cobranças mais recentes.
3. O Gerente abre um registro e consulta competência, valor, modalidade e
   status.
4. Se o comprovante e a NFS-e estiverem disponíveis, pode baixá-los.
5. Se a nota estiver pendente, o sistema explica a falha sem bloquear o acesso.

#### Fluxo K - Reativar durante a retenção

1. O Gerente entra em uma sorveteria bloqueada há menos de 90 dias.
2. O sistema mostra os dados preservados, a data de exclusão e a oferta.
3. O Gerente conclui um novo pagamento.
4. Após confirmação, o sistema cancela a exclusão agendada e reativa todos os
   módulos em até 60 segundos.
5. Usuários, produtos, estoque, pedidos e configurações reaparecem sem alteração.

#### Fluxo L - Excluir automaticamente após 90 dias

1. O sistema avisa os Gerentes 30, 7 e 1 dia antes da data de exclusão.
2. Ao completar 90 dias, tenta cancelar qualquer recorrência remanescente no
   Asaas.
3. O Asaas responde:
   - Sucesso: o sistema remove os dados operacionais e de acesso.
   - Falha: mantém a sorveteria bloqueada, preserva os dados, alerta a operação e
     tenta novamente.
4. Registros fiscais mínimos são movidos ou mantidos no arquivo segregado por
   cinco anos.
5. Backups operacionais envelhecem e expiram em até 30 dias.

#### Fluxo M - Excluir sorveteria manualmente

1. O Gerente inicia a exclusão pela zona de perigo do Identity.
2. O sistema executa as confirmações de identidade e de nome definidas naquele
   módulo.
3. O Billing cancela a assinatura no Asaas:
   - Sucesso: permite a exclusão imediata dos dados operacionais.
   - Falha: não remove dados e preserva o estado anterior.
4. O arquivo fiscal mínimo permanece segregado pelo prazo legal.
5. O acesso é encerrado e os Gerentes recebem a confirmação aplicável.

#### Fluxo N - Indisponibilidade do Asaas

1. Uma consulta ou operação financeira falha por indisponibilidade externa.
2. O Scoops preserva o último estado confirmado da assinatura.
3. Uma sorveteria ativa continua ativa; uma bloqueada continua bloqueada.
4. A ação solicitada permanece pendente ou falha de forma segura, sem presumir
   sucesso.
5. O sistema reconcilia o estado quando o provedor volta e aplica a transição em
   até 60 segundos após a confirmação.

---

### 6. Fora do Escopo (Out of Scope)

- Pagamentos feitos pelos clientes da sorveteria no PDV.
- Caixa, troco, sangria, suprimento e conciliação de vendas.
- Emissão fiscal de pedidos ou vendas da sorveteria.
- Plano gratuito permanente.
- Mais de um plano pago.
- Assinatura anual, semestral ou com fidelidade.
- Cobrança por usuário, produto, pedido, movimentação ou armazenamento.
- Cupons, descontos promocionais, indicação, créditos e preços personalizados.
- Add-ons e módulos vendidos separadamente.
- Pausa de assinatura.
- Boleto, débito, dinheiro ou Pix manual mensal.
- Parcelamento da mensalidade.
- Exportação de dados operacionais durante o bloqueio.
- Backoffice financeiro próprio no Scoops.
- Recuperação de cobrança por WhatsApp, SMS ou ligação.
- Múltiplas sorveterias em uma única assinatura.
- Contratos corporativos, faturamento consolidado e negociação comercial.
- Reembolso proporcional de renovações ou períodos parcialmente utilizados.
- Restauração de sorveteria depois da exclusão operacional concluída.

#### Descartado durante a definição

- **Freemium:** descartado; haverá apenas teste temporário e assinatura paga.
- **Preço de R$ 49,90:** substituído por R$ 59,90 devido ao posicionamento
  vertical e ao impacto de receita por assinatura.
- **Múltiplos planos:** descartados para reduzir comparação, permissões e
  migrações no MVP.
- **Plano anual:** adiado até existirem dados de retenção e preço.
- **Exigir forma de pagamento no teste:** descartado para reduzir a barreira de
  entrada e impedir cobranças inesperadas.
- **Preservar dias restantes ao contratar:** descartado; pagamento confirmado
  encerra o teste e inicia imediatamente o ciclo mensal.
- **Somente cartão:** substituído por cartão e Pix Automático.
- **Pix manual mensal:** substituído por Pix Automático para manter renovação
  recorrente.
- **AbacatePay:** mantida como alternativa futura; Asaas foi escolhido pela
  maturidade, Sandbox e cobertura documentada do fluxo necessário.
- **Appmax:** descartada no MVP por não ter sido identificada documentação
  pública inequívoca de Pix Automático nas fontes consultadas.
- **Cancelamento imediato:** substituído por cancelamento ao fim do período já
  pago.
- **Pausa de assinatura:** descartada; cancelamento e recontratação cobrem a
  necessidade inicial.
- **Bloqueio imediato por inadimplência:** substituído por tolerância de sete
  dias.
- **Bloqueio imediato por chargeback:** substituído por prazo de sete dias para
  regularização.
- **Reativar acesso quando o cancelamento no Asaas falhar:** descartado; a
  sorveteria permanece bloqueada e os dados são preservados.
- **Guardar o banco completo por cinco anos:** descartado; somente o arquivo
  fiscal mínimo permanece por obrigação legal.
- **Backups por 35 dias:** substituídos por retenção máxima de 30 dias.
- **Excluir absolutamente todos os registros:** substituído pela preservação
  segregada do mínimo fiscal e financeiro exigido por lei.
