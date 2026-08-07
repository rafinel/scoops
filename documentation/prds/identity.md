### 1. Visão Geral

O módulo **Identity — Identidade e Acesso** permite criar uma sorveteria no
Scoops, ativar seu primeiro Gerente, autenticar a equipe e administrar o ciclo
de vida dos usuários. O módulo também define quais áreas cada perfil pode
acessar, preserva a autoria das alterações administrativas e mantém cada
usuário vinculado a uma única sorveteria.

O modelo de acesso do MVP é deliberadamente simples. Existem somente os perfis
fixos `Gerente` e `Operador`. Gerentes possuem acesso integral ao Scoops e
administram a equipe. Operadores acessam somente `Nova venda` e `Pedidos`.

**Objetivo:** permitir que uma sorveteria comece a usar o Scoops por meio de um
onboarding direto e mantenha os acessos da equipe atualizados sem configuração
complexa de permissões.

**Problema resolvido:** entradas, mudanças de função e desligamentos da equipe
exigem concessão ou revogação rápida de acesso. Sem regras centralizadas, uma
pessoa pode acessar funções indevidas, ações deixam de ter autoria confiável e
contas antigas permanecem disponíveis.

**Valor entregue:** onboarding simples, acesso previsível, isolamento por
sorveteria, responsabilização individual e controle integral do ciclo de vida
dos dados da organização.

---

### 2. Público-alvo

#### Público principal

Gerentes de sorveterias e açaiterias independentes que precisam cadastrar a
organização, convidar a equipe e controlar quem possui acesso administrativo ou
operacional.

#### Públicos secundários

- Operadores que precisam entrar no Scoops e acessar somente os fluxos de venda
  autorizados.
- Novos responsáveis que iniciam o uso do Scoops e se tornam o primeiro
  Gerente da sorveteria.

#### Não público

- Usuários que precisam pertencer a mais de uma sorveteria com a mesma conta.
- Redes que exigem hierarquia multiloja ou administração centralizada.
- Organizações que precisam de perfis personalizados ou permissões individuais.
- Equipe interna do Scoops buscando assumir a identidade de um cliente ou
  acessar globalmente as sorveterias.

#### Contexto de uso

- Primeiro acesso de uma sorveteria ao Scoops.
- Entrada de novos Gerentes ou Operadores na equipe.
- Promoção, rebaixamento, inativação ou reativação de usuários.
- Uso em computadores, tablets ou celulares, inclusive dispositivos
  compartilhados.
- Consulta de alterações administrativas e identificação de responsáveis.

#### Dores e necessidades

- Começar a usar o produto sem configuração extensa.
- Conceder acesso sem compartilhar senhas.
- Garantir que Operadores não alcancem funções administrativas.
- Remover imediatamente o acesso de quem deixou a equipe.
- Saber quem alterou um usuário e quando.
- Evitar que a sorveteria fique sem um Gerente ativo.
- Excluir integralmente a sorveteria quando o cliente decidir encerrar sua
  utilização do Scoops.

#### Jobs to Be Done

- Quando eu começar a usar o Scoops, quero criar minha sorveteria e confirmar
  minha conta, para assumir a administração com segurança.
- Quando uma pessoa entrar na equipe, quero convidá-la com o perfil correto,
  para que ela crie a própria senha e acesse somente o necessário.
- Quando uma pessoa mudar de função, quero promovê-la ou rebaixá-la, para que o
  acesso acompanhe sua responsabilidade atual.
- Quando uma pessoa deixar a equipe, quero revogar imediatamente seu acesso,
  para proteger a operação sem apagar o histórico.
- Quando uma alteração administrativa gerar dúvida, quero consultar quem a
  realizou e quando, para reconstruir o ocorrido.
- Quando eu decidir encerrar definitivamente o uso do Scoops, quero excluir a
  sorveteria e todos os dados associados, para não manter uma operação residual.

---

### 3. Análise do Cenário Competitivo

Soluções de gestão para alimentação e ponto de venda costumam oferecer usuários
e permissões como parte de plataformas operacionais mais amplas. Segundo suas
fontes oficiais, há abordagens que vão de permissões configuradas diretamente
por usuário a funções reutilizáveis e códigos pessoais para identificação no
caixa.

O Scoops não buscará reproduzir essa granularidade no MVP. A oportunidade está
em oferecer um modelo mais fácil de compreender para pequenas equipes: dois
perfis fixos, nenhuma exceção individual e regras explícitas para promoção,
inativação e preservação de autoria.

#### Matriz competitiva

| Solução | Público | Proposta de valor | Funcionalidades | Preço público | Limitações |
|---|---|---|---|---|---|
| [Saipos](https://saipos.com/sistema/sorveteria) | Sorveterias e estabelecimentos de alimentação | Centralizar atendimento, estoque, gestão e delivery | Usuários, tipos e permissões individuais, além dos módulos operacionais | A página oficial informa planos a partir de R$ 219,90/mês | Segundo a [documentação de usuários](https://meajuda.saipos.com/hc/pt-br/articles/27043903853460-Como-criar-um-novo-usu%C3%A1rio-no-sistema-Saipos), o mesmo usuário não pode ser usado simultaneamente em dois dispositivos |
| [Toast](https://support.toasttab.com/en/article/Access-Permissions-Reference) | Restaurantes, grupos e operações com múltiplas unidades | Controlar responsabilidades da equipe no ponto de venda e na administração | Permissões por função, múltiplas funções por funcionário e regras por localização | Não identificado publicamente nas fontes consultadas | Maior amplitude de configuração do que a necessária para o público inicial do Scoops |
| [Square](https://my.squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale) | Pequenos e médios negócios com ponto de venda | Identificar membros da equipe e limitar ações no caixa | Conjuntos de permissões, códigos pessoais, código compartilhado e código do proprietário | O [Square Advanced Access](https://squareup.com/us/en/staff/advanced-access) é informado como incluído nos planos Square Plus de US$ 49/mês por local e Premium de US$ 149/mês por local | Códigos compartilhados não permitem atribuir vendas e atividades a uma pessoa específica |
| Planilha, senha compartilhada e controle verbal | Pequenas operações sem gestão formal de acesso | Baixo esforço inicial | Lista manual de pessoas e compartilhamento informal de credenciais | Variável | Não revoga acesso de forma confiável, reduz autoria e aumenta erros administrativos |

#### Constatações e inferências

- Segundo a documentação oficial da Saipos, permissões podem ser habilitadas ou
  desabilitadas por usuário e a gestão exige acesso gerencial.
- A página oficial do Toast informa que permissões são normalmente atribuídas
  por funções e podem variar entre localizações.
- A documentação do Square diferencia códigos pessoais, compartilhados e do
  proprietário; somente o código pessoal preserva a atribuição individual.
- Inferência baseada nas fontes: soluções maduras atendem operações maiores com
  modelos flexíveis, mas exigem mais decisões de configuração.
- Inferência baseada nas fontes: o Scoops pode se diferenciar para pequenas
  equipes reduzindo a configuração sem abrir mão de autoria e revogação.

#### Diferenciais recomendados

- Onboarding da sorveteria e do primeiro Gerente em um único fluxo.
- Somente dois perfis, com responsabilidades fáceis de explicar.
- Nenhuma permissão individual capaz de criar combinações inesperadas.
- Convites que preservam o segredo da senha do novo usuário.
- Regras que impedem autoelevação e ausência de Gerente ativo.
- Auditoria administrativa compreensível pelo próprio Gerente.
- Exclusão integral da sorveteria sob comando do cliente.

---

### 4. Requisitos

#### REQ-01 Onboarding da Sorveteria

- [ ] **Onboarding da Sorveteria**

**Descrição:** Um novo cliente deve conseguir criar uma sorveteria e sua conta
de primeiro Gerente por meio de um fluxo público.

##### Regras de Negócio

- **Dados obrigatórios:** o fluxo deve solicitar nome da sorveteria, nome do
  Gerente, e-mail e senha.
- **Sorveteria:** o nome deve ser obrigatório, mas pode se repetir em
  sorveterias diferentes.
- **Primeiro perfil:** o primeiro usuário deve receber o perfil `Gerente`.
- **Acesso pendente:** o Gerente não pode acessar o sistema antes de confirmar a
  conta.
- **Ativação conjunta:** a confirmação deve ativar a sorveteria e o primeiro
  Gerente.
- **Correção do e-mail pendente:** antes da ativação, o responsável deve poder
  retornar à etapa inicial para corrigir somente o e-mail do primeiro Gerente;
  o nome da sorveteria e o nome do Gerente devem permanecer preenchidos.
- **Confirmação da correção:** para salvar o novo e-mail, o responsável deve
  informar novamente a senha cadastrada.
- **Validação da correção:** o novo e-mail deve ser válido e estar disponível;
  em caso de falha, o endereço anterior e o onboarding pendente devem ser
  preservados.
- **Novo envio:** após salvar um novo e-mail, o link de confirmação anterior
  deve perder a validade e uma nova confirmação deve ser enviada ao endereço
  corrigido.
- **Cancelamento da correção:** ao cancelar a edição, o responsável deve voltar
  à confirmação pendente sem alterar o cadastro.
- **Prazo:** um onboarding não confirmado deve expirar após sete dias.
- **Prazo após correção:** corrigir o e-mail ou reenviar a confirmação não deve
  reiniciar o prazo original de sete dias do onboarding.
- **Expiração:** ao expirar, a sorveteria pendente e a conta correspondente
  devem ser removidas, liberando o e-mail para nova tentativa.
- **Cadastro avulso:** não deve existir criação pública de usuário sem uma nova
  sorveteria ou convite válido.
- **Dependência:** a contratação comercial pode acompanhar o onboarding, mas
  suas regras pertencem ao módulo de Assinatura.

##### Regras de UI/UX

- **Interface:** apresentar formulário curto, com progresso claro e linguagem
  voltada ao responsável pela sorveteria.
- **Feedback:** após o envio, informar que a conta depende da confirmação e
  indicar o endereço utilizado.
- **Correção:** na etapa de confirmação pendente, apresentar a ação `Voltar e
  corrigir`; ao acioná-la, retornar à etapa inicial em modo de edição, manter os
  dados preenchidos e colocar foco no campo de e-mail.
- **Retorno após correção:** depois de salvar, retornar à confirmação pendente,
  exibir o endereço atualizado e informar que uma nova mensagem foi enviada.
- **Estado vazio:** não aplicável ao formulário inicial.
- **Ação bloqueada:** impedir acesso aos módulos enquanto a confirmação estiver
  pendente.
- **Responsividade:** o fluxo deve funcionar integralmente a partir de 320 px.
- **Acessibilidade:** campos devem possuir labels, instruções, foco visível e
  erros anunciados por tecnologia assistiva.

---

#### REQ-02 Autenticação e Sessão

- [ ] **Autenticação e Sessão**

**Descrição:** Usuários ativos devem entrar no Scoops com e-mail e senha e
permanecer autenticados somente durante uma sessão válida.

##### Regras de Negócio

- **Método:** o MVP deve aceitar somente e-mail e senha.
- **Conta ativa:** somente usuários ativos de sorveterias ativas podem entrar.
- **Mensagem neutra:** falhas não devem revelar se um e-mail está cadastrado.
- **Tentativas:** após cinco falhas consecutivas, novas tentativas devem ser
  bloqueadas por 15 minutos.
- **Inatividade:** a sessão deve expirar após 30 minutos sem interação.
- **Duração máxima:** uma sessão deve exigir nova autenticação após sete dias,
  mesmo que permaneça em uso.
- **Simultaneidade:** o mesmo usuário pode manter sessões em vários dispositivos.
- **Saída:** `Sair deste dispositivo` deve encerrar somente a sessão atual.
- **Perda de sessão:** quando possível, trabalho não concluído deve ser
  preservado para retomada após novo login.

##### Regras de UI/UX

- **Interface:** apresentar marca Scoops, e-mail, senha, ação principal de
  entrada e acesso à recuperação.
- **Feedback:** diferenciar carregamento, falha de credenciais, bloqueio
  temporário e sessão expirada.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** contas pendentes, inativas ou pertencentes a sorveterias
  indisponíveis devem receber orientação sem exposição de dados internos.
- **Responsividade:** o formulário deve permanecer legível e operável em
  celular, tablet e computador.
- **Acessibilidade:** deve permitir preenchimento por teclado, leitores de tela
  e gerenciadores de senha.

---

#### REQ-03 Senha e Recuperação de Acesso

- [ ] **Senha e Recuperação de Acesso**

**Descrição:** O usuário deve criar ou redefinir a própria senha sem que um
Gerente possa conhecê-la ou defini-la em seu lugar.

##### Regras de Negócio

- **Comprimento:** a senha deve aceitar entre 8 e 64 caracteres.
- **Responsabilidade:** Gerentes nunca podem visualizar ou definir senhas de
  outros usuários.
- **Recuperação:** toda troca de senha deve acontecer pelo fluxo de recuperação
  enviado ao e-mail cadastrado.
- **Uso único:** o link de recuperação deve ser utilizável uma única vez.
- **Validade:** o link deve expirar após uma hora.
- **Revogação:** a redefinição deve encerrar todas as sessões do usuário.
- **Conta inexistente:** a solicitação deve apresentar a mesma resposta para
  e-mails cadastrados e não cadastrados.
- **Limite individual:** um endereço pode receber no máximo três mensagens de
  autenticação em 24 horas.
- **Intervalo:** reenvios devem respeitar intervalo mínimo de dois minutos.

##### Regras de UI/UX

- **Interface:** solicitar somente o e-mail na recuperação e a nova senha após
  validação do link.
- **Feedback:** confirmar a solicitação sem revelar a existência da conta.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** links expirados ou usados devem orientar uma nova
  solicitação.
- **Responsividade:** o fluxo deve funcionar sem rolagem horizontal em telas
  pequenas.
- **Acessibilidade:** requisitos e erros da senha devem ser textuais e não
  depender somente de cor.

---

#### REQ-04 Perfis e Autorização

- [ ] **Perfis e Autorização**

**Descrição:** O sistema deve aplicar permissões fixas por perfil em todas as
entradas de navegação e ações protegidas.

##### Regras de Negócio

- **Perfis:** devem existir somente `Gerente` e `Operador`.
- **Imutabilidade:** perfis não podem ser criados, renomeados, editados,
  duplicados ou excluídos.
- **Sem exceções:** não deve existir concessão ou remoção individual de
  permissões.
- **Gerente:** possui acesso integral a todos os módulos e configurações.
- **Operador:** pode acessar somente `Nova venda` e `Pedidos`.
- **Acesso direto:** endereços ou atalhos não podem contornar as permissões.
- **Isolamento:** todo usuário e toda ação devem permanecer restritos à própria
  sorveteria.
- **Perfil próprio:** nenhum usuário pode promover ou rebaixar a si mesmo.
- **Último Gerente:** nenhuma ação pode deixar a sorveteria sem ao menos um
  Gerente ativo.

##### Regras de UI/UX

- **Interface:** exibir o perfil como atributo fixo do usuário, sem controles de
  permissões granulares.
- **Feedback:** promoção e rebaixamento devem apresentar confirmação e resultado.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** ocultar ações incompatíveis com o perfil e explicar
  bloqueios administrativos relevantes.
- **Responsividade:** menus autorizados devem permanecer acessíveis em telas
  menores sem cobrir o conteúdo.
- **Acessibilidade:** o estado ativo e as restrições não devem depender somente
  de cor.

---

#### REQ-05 Cadastro e Convite de Usuários

- [ ] **Cadastro e Convite de Usuários**

**Descrição:** Um Gerente deve conseguir convidar um novo usuário para a própria
sorveteria com nome, e-mail e perfil.

##### Regras de Negócio

- **Autorização:** somente Gerentes podem cadastrar usuários.
- **Campos:** nome, e-mail e perfil são obrigatórios.
- **E-mail único:** cada e-mail pode pertencer a somente uma conta em todo o
  Scoops, ignorando diferenças entre maiúsculas e minúsculas.
- **Estado inicial:** o usuário deve permanecer `Pendente` até aceitar o convite
  e definir a senha.
- **Validade:** o convite deve expirar após sete dias.
- **Reenvio:** um novo convite deve invalidar o link anterior e reiniciar o
  prazo.
- **Correção pendente:** antes da ativação, o Gerente pode corrigir os dados do
  convite.
- **Cancelamento:** convites pendentes podem ser cancelados e removidos
  definitivamente.
- **Ativação:** o usuário ativado deve assumir o perfil escolhido no convite.
- **Gerente convidado:** um Gerente pode cadastrar diretamente outro Gerente.

##### Regras de UI/UX

- **Interface:** apresentar formulário com nome, e-mail e seleção entre os dois
  perfis, acompanhado de uma explicação curta de cada perfil.
- **Feedback:** informar envio, reenvio, ativação, expiração e cancelamento.
- **Estado vazio:** quando existir somente o primeiro Gerente, convidar a
  adicionar a equipe.
- **Ação bloqueada:** e-mail duplicado ou limite temporário de envio deve ser
  informado junto à ação correspondente.
- **Responsividade:** formulário e confirmações devem caber em telas pequenas.
- **Acessibilidade:** seleção de perfil e mensagens devem ser operáveis e
  compreensíveis por teclado e leitor de tela.

---

#### REQ-06 Listagem e Consulta de Usuários

- [ ] **Listagem e Consulta de Usuários**

**Descrição:** Gerentes devem localizar usuários e compreender rapidamente seu
perfil, estado e atividade recente.

##### Regras de Negócio

- **Autorização:** somente Gerentes podem consultar a gestão da equipe.
- **Dados visíveis:** a listagem deve apresentar nome, e-mail, perfil, status e
  último acesso.
- **Busca:** deve localizar por nome ou e-mail.
- **Filtros:** deve filtrar por perfil e status.
- **Estados:** a listagem deve distinguir `Pendente`, `Ativo` e `Inativo`.
- **Detalhe:** cada usuário deve possuir uma visão com dados, ações disponíveis
  e histórico administrativo.
- **Isolamento:** nenhum resultado pode incluir usuário de outra sorveteria.

##### Regras de UI/UX

- **Interface:** utilizar tabela ou lista responsiva com ações contextuais.
- **Feedback:** busca, filtros e carregamento devem indicar o estado atual.
- **Estado vazio:** distinguir ausência de equipe de busca ou filtro sem
  resultados.
- **Ação bloqueada:** ações indisponíveis devem ser ocultadas ou apresentar a
  razão do bloqueio.
- **Responsividade:** em telas estreitas, priorizar nome, perfil e status e
  mover detalhes para a visão dedicada.
- **Acessibilidade:** filtros, linhas e menus de ações devem ser navegáveis por
  teclado.

---

#### REQ-07 Promoção e Rebaixamento

- [ ] **Promoção e Rebaixamento**

**Descrição:** Um Gerente deve conseguir promover um Operador a Gerente ou
rebaixar outro Gerente a Operador.

##### Regras de Negócio

- **Autorização:** somente Gerentes podem alterar o perfil de outro usuário.
- **Autoalteração:** o usuário não pode alterar o próprio perfil.
- **Promoção:** deve conceder imediatamente o conjunto integral do perfil
  `Gerente`.
- **Rebaixamento:** deve remover imediatamente os acessos administrativos e
  preservar `Nova venda` e `Pedidos`.
- **Último Gerente:** o rebaixamento deve ser bloqueado quando deixar a
  sorveteria sem um Gerente ativo.
- **Histórico:** a alteração não deve modificar a autoria de ações anteriores.
- **Notificação:** o usuário afetado deve ser comunicado sobre a mudança.

##### Regras de UI/UX

- **Interface:** apresentar a ação no detalhe do usuário com descrição do acesso
  adquirido ou perdido.
- **Feedback:** exigir confirmação e informar sucesso ou falha.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** explicar a proibição de autoalteração e a proteção do
  último Gerente.
- **Responsividade:** a confirmação deve preservar leitura e ações em telas
  pequenas.
- **Acessibilidade:** foco deve retornar ao elemento acionador após fechar a
  confirmação.

---

#### REQ-08 Inativação e Reativação

- [ ] **Inativação e Reativação**

**Descrição:** Gerentes devem revogar e restaurar o acesso de usuários sem
apagar sua identidade ou histórico.

##### Regras de Negócio

- **Inativação:** deve encerrar imediatamente todas as sessões do usuário e
  impedir novas entradas.
- **Auto-inativação:** nenhum usuário pode inativar a própria conta.
- **Último Gerente:** não deve ser possível inativar o último Gerente ativo.
- **Histórico:** usuários com atividade devem ser inativados, nunca excluídos
  individualmente.
- **E-mail reservado:** o e-mail de um usuário inativo não pode ser reutilizado.
- **Reativação:** deve restaurar o acesso da mesma conta com o perfil atual.
- **Senha:** a reativação não autoriza o Gerente a definir uma senha.
- **Notificação:** o usuário deve ser comunicado sobre inativação e reativação.

##### Regras de UI/UX

- **Interface:** exibir status e ação correspondente no detalhe do usuário.
- **Feedback:** a inativação deve avisar que sessões abertas serão encerradas.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** explicar auto-inativação proibida e proteção do último
  Gerente.
- **Responsividade:** ações devem permanecer disponíveis sem depender de hover.
- **Acessibilidade:** status deve possuir texto explícito além da cor.

---

#### REQ-09 Dados Pessoais e Minha Conta

- [ ] **Dados Pessoais e Minha Conta**

**Descrição:** Todo usuário deve consultar sua identidade, alterar o próprio
nome e encerrar a sessão atual.

##### Regras de Negócio

- **Nome próprio:** qualquer usuário pode alterar o próprio nome.
- **Correção por Gerente:** Gerentes podem corrigir o nome de outros usuários.
- **E-mail ativo:** o e-mail não pode ser alterado após a ativação.
- **Snapshot:** alterações de nome não devem modificar nomes preservados em
  registros históricos.
- **Perfil:** o perfil deve ser somente leitura em `Minha conta`.
- **Saída:** deve existir somente a ação `Sair deste dispositivo`.
- **Senha:** não deve existir troca direta de senha dentro da sessão; o usuário
  utiliza a recuperação por e-mail.

##### Regras de UI/UX

- **Interface:** exibir nome editável, e-mail e perfil somente leitura e ação de
  saída.
- **Feedback:** alterações de nome devem informar salvamento, erro e estado de
  carregamento.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** campos imutáveis devem explicar por que não podem ser
  alterados.
- **Responsividade:** a página deve funcionar integralmente em celular.
- **Acessibilidade:** campos somente leitura devem ser distinguíveis sem perder
  legibilidade.

---

#### REQ-10 Auditoria Administrativa

- [ ] **Auditoria Administrativa**

**Descrição:** O módulo deve manter um histórico imutável das alterações de
identidade e acesso realizadas na sorveteria.

##### Regras de Negócio

- **Ações auditadas:** cadastrar, reenviar convite, cancelar convite, ativar,
  promover, rebaixar, inativar, reativar, iniciar recuperação e alterar nomes.
- **Conteúdo:** cada registro deve identificar ação, usuário afetado, responsável
  e data e hora.
- **Alterações:** quando aplicável, preservar valor anterior e novo valor.
- **Segredos:** senhas, links de ativação e conteúdos de recuperação nunca devem
  aparecer na auditoria.
- **Imutabilidade:** registros não podem ser editados ou removidos
  individualmente.
- **Retenção:** a auditoria permanece por toda a vida da sorveteria.
- **Acesso:** somente Gerentes podem consultar a auditoria.
- **Fuso:** datas devem ser exibidas no horário de São Paulo.

##### Regras de UI/UX

- **Interface:** exibir linha do tempo no detalhe do usuário com ação,
  responsável e momento.
- **Feedback:** carregamento e falha de consulta devem ser informados.
- **Estado vazio:** explicar quando ainda não houver alteração além da criação.
- **Ação bloqueada:** Operadores não devem visualizar entradas ou atalhos para a
  auditoria.
- **Responsividade:** eventos devem reorganizar seus campos sem truncar a ação.
- **Acessibilidade:** a ordem cronológica e os relacionamentos devem ser
  compreensíveis fora da apresentação visual.

---

#### REQ-11 Gestão da Sorveteria

- [ ] **Gestão da Sorveteria**

**Descrição:** Gerentes devem consultar e alterar o nome da própria sorveteria.

##### Regras de Negócio

- **Dado único:** o cadastro institucional do MVP contém somente o nome da
  sorveteria.
- **Alteração:** qualquer Gerente pode alterar o nome.
- **Identidade histórica:** a alteração não deve mover usuários ou dados para
  outra sorveteria.
- **Auditoria:** a mudança deve preservar nome anterior, novo nome, responsável
  e momento.
- **Duplicidade:** outra sorveteria pode utilizar o mesmo nome.
- **Acesso:** Operadores não podem consultar nem alterar essa configuração.

##### Regras de UI/UX

- **Interface:** apresentar o nome atual e uma ação clara de edição.
- **Feedback:** informar sucesso, erro e carregamento da alteração.
- **Estado vazio:** não aplicável, pois o nome é obrigatório desde o onboarding.
- **Ação bloqueada:** Operadores não devem visualizar `Sorveteria` na navegação.
- **Responsividade:** edição e feedback devem funcionar em celular.
- **Acessibilidade:** o estado de edição deve manter label, instrução e foco
  visível.

---

#### REQ-12 Exclusão da Sorveteria

- [ ] **Exclusão da Sorveteria**

**Descrição:** Qualquer Gerente deve conseguir excluir imediatamente e de forma
irreversível a sorveteria e todos os dados associados.

##### Regras de Negócio

- **Autorização:** somente Gerentes podem iniciar a exclusão.
- **Abrangência:** a exclusão deve remover usuários, produtos, estoque, pedidos,
  configurações, históricos, auditorias e quaisquer outros dados pertencentes à
  sorveteria.
- **Assinatura:** a assinatura deve ser cancelada com sucesso antes da remoção.
- **Falha de cancelamento:** se o cancelamento falhar, nenhum dado deve ser
  removido.
- **Confirmação de identidade:** o Gerente deve informar novamente sua senha.
- **Confirmação textual:** o Gerente deve digitar o nome atual da sorveteria.
- **Consequências:** o sistema deve listar claramente as categorias de dados que
  serão apagadas.
- **Imediata:** não deve existir agendamento, período de arrependimento ou
  restauração pelo cliente.
- **Irreversibilidade:** após a confirmação final, o acesso deve ser bloqueado e
  a exclusão deve prosseguir até remover todos os dados.
- **Falha parcial:** uma interrupção não deve reativar a sorveteria; o processo
  deve continuar até sua conclusão.
- **Notificação:** após concluir, todos os Gerentes devem receber uma mensagem
  com sorveteria, responsável, data e caráter irreversível.

##### Regras de UI/UX

- **Interface:** colocar a ação em uma zona de perigo separada das configurações
  comuns.
- **Feedback:** usar confirmação em etapas, linguagem direta e conclusão
  inequívoca.
- **Estado vazio:** não aplicável.
- **Ação bloqueada:** explicar falhas de senha, divergência de nome ou problema
  no cancelamento da assinatura sem iniciar remoção parcial.
- **Responsividade:** consequências e confirmações devem permanecer integralmente
  legíveis em telas pequenas.
- **Acessibilidade:** a gravidade não deve ser comunicada somente pela cor e o
  foco deve permanecer contido nas confirmações.

---

#### REQ-13 Navegação, Estados e Qualidade da Experiência

- [ ] **Navegação, Estados e Qualidade da Experiência**

**Descrição:** O Identity deve oferecer navegação coerente, estados claros e
uma experiência acessível em todos os fluxos.

##### Regras de Negócio

- **Usuários:** disponível somente para Gerentes.
- **Sorveteria:** disponível somente para Gerentes.
- **Minha conta:** disponível para Gerentes e Operadores no menu do usuário.
- **Cobertura de estados:** devem existir estados para confirmação pendente,
  convite pendente, link expirado, link já utilizado, conta inativa, acesso
  negado, falha de comunicação e sessão expirada.
- **Consistência:** menus ocultos não substituem a validação das ações protegidas.
- **Autoria:** ações relevantes devem sempre permanecer associadas ao usuário
  que as realizou.

##### Regras de UI/UX

- **Interface:** seguir o design system do Scoops, com Manrope, superfícies
  neutras, roxo como cor de marca e ícones Lucide.
- **Feedback:** toda ação que aguarde uma resposta deve apresentar carregamento,
  sucesso e erro.
- **Estado vazio:** cada lista sem conteúdo deve explicar a situação e oferecer
  a próxima ação válida.
- **Ação bloqueada:** mensagens devem explicar o motivo e, quando possível, como
  resolver.
- **Responsividade:** todos os fluxos devem funcionar a partir de 320 px sem
  rolagem horizontal obrigatória.
- **Acessibilidade:** atender WCAG 2.2 nível AA, com contraste, foco visível,
  navegação por teclado, labels, mensagens anunciadas e alvos de toque adequados.

---

#### REQ-14 Critérios de Sucesso do MVP

- [ ] **Critérios de Sucesso do MVP**

**Descrição:** O desempenho do produto deve ser acompanhado por indicadores de
ativação, autonomia administrativa e segurança funcional.

##### Regras de Negócio

- **Onboarding:** ao menos 90% dos onboardings concluídos devem confirmar a conta
  em até 24 horas.
- **Convites:** ao menos 90% dos convites aceitos devem ser concluídos sem
  intervenção de suporte.
- **Eficiência:** cadastro ou alteração de usuário deve poder ser concluído em
  menos de dois minutos por um Gerente familiarizado com o fluxo.
- **Auditoria:** 100% das ações administrativas previstas devem produzir o
  registro correspondente.
- **Autorização:** nenhum cenário de validação pode permitir acesso entre
  sorveterias ou ação incompatível com o perfil.
- **Acompanhamento:** os indicadores devem ser avaliados após o lançamento para
  orientar correções e priorização.

##### Regras de UI/UX

- **Interface:** eventos necessários à medição não devem adicionar etapas ao
  fluxo do usuário.
- **Feedback:** falhas que impedem conclusão devem ser distinguíveis de abandono
  voluntário.
- **Estado vazio:** relatórios sem volume suficiente devem indicar ausência de
  amostra conclusiva.
- **Ação bloqueada:** não aplicável ao uso cotidiano do módulo.
- **Responsividade:** qualquer visualização futura dos indicadores deve seguir o
  padrão responsivo do produto.
- **Acessibilidade:** indicadores não devem depender somente de cor.

---

### 5. Fluxo de Usuário (User Flow)

#### Fluxo A - Criar sorveteria e primeiro Gerente

1. O responsável inicia o onboarding público.
2. O sistema solicita nome da sorveteria, nome do Gerente, e-mail e senha.
3. O responsável envia o cadastro.
4. O sistema mantém a sorveteria e a conta pendentes e solicita confirmação.
5. Na confirmação pendente, o responsável pode selecionar `Voltar e corrigir`:
   - O sistema retorna à etapa inicial em modo de edição, preserva o nome da
     sorveteria e o nome do Gerente e coloca foco no e-mail.
   - O responsável altera o e-mail, informa novamente a senha e salva.
   - Sucesso: o sistema invalida o link anterior, envia uma nova confirmação,
     retorna à etapa pendente e mantém o prazo original de sete dias.
   - E-mail inválido ou indisponível: preserva o endereço anterior e apresenta
     o motivo da correção necessária.
   - Cancelamento: retorna à confirmação pendente sem alterar o cadastro.
6. O responsável confirma a conta:
   - Sucesso: sorveteria e primeiro Gerente ficam ativos.
   - Link inválido, já utilizado ou expirado: o sistema orienta o reenvio da
     confirmação, um novo cadastro ou a entrada, caso a conta já esteja ativa.
7. O Gerente entra no Scoops e inicia a configuração da operação.

#### Fluxo B - Entrar no Scoops

1. O usuário informa e-mail e senha.
2. O sistema valida conta, sorveteria e tentativas anteriores.
3. O sistema decide:
   - Sucesso: abre a primeira área autorizada para o perfil.
   - Credenciais inválidas: apresenta mensagem neutra e preserva o e-mail.
   - Bloqueio temporário: informa quando será possível tentar novamente.
   - Conta pendente ou inativa: orienta o usuário sem revelar dados internos.
4. Após inatividade ou duração máxima, o sistema solicita novo login.

#### Fluxo C - Recuperar acesso

1. O usuário seleciona `Esqueci minha senha`.
2. Informa o e-mail.
3. O sistema apresenta a mesma confirmação independentemente da existência da
   conta.
4. O usuário abre um link válido e define a nova senha.
5. O sistema valida:
   - Sucesso: altera a senha e encerra as sessões anteriores.
   - Link expirado ou usado: orienta nova solicitação.
6. O usuário entra novamente.

#### Fluxo D - Convidar usuário

1. Um Gerente acessa `Usuários` e seleciona `Convidar usuário`.
2. Informa nome, e-mail e perfil.
3. O sistema valida unicidade e campos obrigatórios.
4. O Gerente confirma o envio.
5. O cadastro aparece como `Pendente`.
6. O convidado aceita o convite e define a senha:
   - Sucesso: o usuário fica `Ativo` com o perfil escolhido.
   - Link expirado: o Gerente pode reenviar um novo convite.

#### Fluxo E - Cancelar convite pendente

1. O Gerente abre um usuário `Pendente`.
2. Seleciona `Cancelar convite`.
3. O sistema informa que o link perderá a validade e o cadastro será removido.
4. O Gerente confirma:
   - Sucesso: o convite é invalidado e o e-mail liberado.
   - Falha: o cadastro permanece pendente.

#### Fluxo F - Promover Operador

1. O Gerente abre um Operador ativo.
2. Seleciona `Promover a Gerente`.
3. O sistema lista o acesso que será concedido.
4. O Gerente confirma.
5. O usuário recebe acesso integral, registro de auditoria e notificação.

#### Fluxo G - Rebaixar Gerente

1. O Gerente abre outro Gerente ativo.
2. Seleciona `Rebaixar para Operador`.
3. O sistema valida:
   - Há outro Gerente ativo: permite continuar.
   - A ação deixaria a sorveteria sem Gerente: bloqueia e explica a regra.
4. O Gerente confirma.
5. O usuário passa a acessar somente `Nova venda` e `Pedidos` e é notificado.

#### Fluxo H - Inativar usuário

1. O Gerente abre outro usuário ativo.
2. Seleciona `Inativar`.
3. O sistema valida auto-inativação e proteção do último Gerente.
4. O sistema informa que acessos existentes serão encerrados.
5. O Gerente confirma:
   - Sucesso: o usuário fica `Inativo`, perde acesso e é notificado.
   - Falha: nenhum estado é alterado.

#### Fluxo I - Reativar usuário

1. O Gerente filtra usuários inativos.
2. Abre a conta desejada e seleciona `Reativar`.
3. O sistema preserva e exibe o perfil atual.
4. O Gerente confirma.
5. O usuário fica ativo e recebe uma notificação.

#### Fluxo J - Consultar auditoria

1. O Gerente abre o detalhe de um usuário.
2. O sistema apresenta a linha do tempo administrativa.
3. O Gerente identifica ação, responsável, momento e alterações aplicáveis.
4. Se não houver eventos adicionais, o sistema explica que existe somente o
   registro inicial.

#### Fluxo K - Alterar nome da sorveteria

1. O Gerente acessa `Sorveteria`.
2. Altera o nome e confirma.
3. O sistema valida que o valor não está vazio.
4. O sistema salva a alteração e registra a auditoria.
5. O novo nome passa a aparecer nas áreas futuras sem alterar históricos.

#### Fluxo L - Excluir sorveteria

1. O Gerente acessa a zona de perigo em `Sorveteria`.
2. O sistema lista todos os grupos de dados que serão removidos.
3. O Gerente informa novamente a senha.
4. Digita o nome atual da sorveteria.
5. O sistema cancela a assinatura:
   - Sucesso: permite a confirmação final.
   - Falha: bloqueia a exclusão sem remover dados.
6. O Gerente confirma a ação irreversível.
7. O acesso à sorveteria é encerrado e todos os dados associados são removidos.
8. Todos os Gerentes recebem uma notificação da conclusão.

#### Fluxo M - Alterar o próprio nome e sair

1. O usuário abre `Minha conta`.
2. Altera o nome:
   - Sucesso: o novo nome passa a ser exibido em usos futuros.
   - Falha: o valor anterior é preservado.
3. Quando desejar, seleciona `Sair deste dispositivo`.
4. Somente a sessão atual é encerrada e o usuário retorna ao login.

---

### 6. Fora do Escopo (Out of Scope)

- Múltiplas sorveterias vinculadas à mesma conta.
- Hierarquia de grupos, filiais ou franquias.
- Perfis além de `Gerente` e `Operador`.
- Perfis personalizados e permissões individuais.
- Códigos pessoais ou compartilhados para acesso rápido no PDV.
- Autenticação em dois fatores.
- Login social, corporativo ou sem senha.
- Alteração de e-mail após a ativação.
- Troca direta de senha dentro de `Minha conta`.
- Ação manual para encerrar todas as sessões.
- Exclusão individual de usuário com histórico.
- Dados da sorveteria além do nome.
- Superadministrador, impersonação ou acesso global às sorveterias.
- Agendamento, cancelamento ou recuperação da exclusão da sorveteria.
- Exportação de dados antes da exclusão.
- Configurações operacionais de estoque, vendas, impressão ou cardápio dentro do
  Identity.

#### Descartado durante a definição

- **Perfis personalizados:** descartados em favor de apenas `Gerente` e
  `Operador`, reduzindo configuração e combinações inesperadas.
- **Permissões individuais:** substituídas por conjuntos fixos por perfil.
- **PIN no PDV:** descartado; o acesso utiliza e-mail e senha.
- **Múltiplas sorveterias por usuário:** descartadas para manter vínculo único no
  MVP.
- **Dados institucionais adicionais:** razão social, documentos, contatos e
  endereço foram considerados e removidos; a sorveteria possui somente nome.
- **Alteração de senha autenticada:** substituída exclusivamente pela recuperação
  por e-mail.
- **Sessão única:** descartada; múltiplos dispositivos podem permanecer ativos.
- **Encerrar todas as sessões manualmente:** descartado; a interface oferece
  somente saída do dispositivo atual.
- **Exclusão agendada:** descartada; a exclusão da sorveteria é imediata e
  irreversível após confirmação reforçada.
- **Superadministrador:** descartado para evitar acesso global às sorveterias.
