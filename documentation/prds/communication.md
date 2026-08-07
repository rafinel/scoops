# PRD — Módulo de Comunicação

## Visão Geral

O módulo de Comunicação centraliza o envio de mensagens importantes do Scoops.

Ele será responsável por enviar e-mails e exibir notificações dentro do produto quando acontecimentos relevantes ocorrerem em outros módulos, como Identity, Billing e Estoque.

O objetivo é garantir que cada usuário receba informações claras, no momento adequado e pelo canal correto.

## Público-alvo

- Gerentes de sorveterias.
- Usuários convidados ou afetados por alterações de acesso.
- Responsáveis financeiros.
- Usuários que precisam acompanhar alertas operacionais da sorveteria.

## Cenário Competitivo

Soluções para restaurantes e varejo já utilizam alertas de estoque e comunicações centralizadas para reduzir rupturas e apoiar decisões operacionais. Esse comportamento aparece em produtos como [Consumer](https://consumer.com.br/reduzir-desperdicio-restaurante) e [Saipos](https://saipos.com/sistema/sorveteria).

O diferencial do Scoops será reunir comunicações de diferentes módulos em uma experiência única, com mensagens específicas para cada destinatário e histórico permanente dentro do produto.

## Requisitos

### REQ-01 — Canais de comunicação

O módulo deve permitir:

- Envio de e-mails.
- Exibição de notificações dentro do produto.
- Uso de um ou dos dois canais para cada tipo de mensagem.
- Destinatários diferentes conforme o contexto da mensagem.

SMS, WhatsApp e notificações push não fazem parte do MVP.

### REQ-02 — Mensagens de Estoque

O módulo deve exibir notificações internas para:

- Estoque abaixo do ideal: informar o produto, a quantidade disponível e a quantidade ideal.
- Estoque zerado: informar o produto que não possui quantidade disponível.

### REQ-03 — Mensagens de Billing

O módulo deve enviar ou exibir mensagens relacionadas a:

- Fim do período de teste, com avisos 7, 3 e 1 dia antes.
- Pagamento em processamento.
- Falha de cobrança.
- Período de tolerância por inadimplência.
- Bloqueio da sorveteria.
- Cancelamento da assinatura.
- Reativação da assinatura.
- Reajuste de preço, com aviso mínimo de 30 dias.
- Exclusão automática, com avisos 30, 7 e 1 dia antes.
- Comprovantes de cobrança.
- NFS-e.
- Comunicações de cobrança para o responsável financeiro.
- Chargeback para os Gerentes.
- Falhas fiscais e operacionais relevantes.

As mensagens devem informar a situação, o prazo aplicável e o que o destinatário precisa fazer, quando houver uma ação necessária.

### REQ-04 — Mensagens de Identity

O módulo deve enviar e-mails para:

- Confirmação do onboarding.
- Confirmação após alteração do e-mail.
- Convite de usuário.
- Reenvio de convite.
- Recuperação de senha.
- Promoção ou rebaixamento de usuário.
- Inativação ou reativação de usuário.
- Exclusão da sorveteria para os Gerentes.

### REQ-05 — Conteúdo das mensagens

Cada mensagem deve ter conteúdo adequado ao canal e ao destinatário.

As notificações internas devem apresentar:

- Título objetivo.
- Mensagem com o contexto necessário.
- Data e hora de recebimento.

Os e-mails devem apresentar assunto, conteúdo em HTML e, quando necessário, documentos anexos.

As mensagens devem ser escritas em português do Brasil no MVP.

### REQ-06 — Central de notificações

O produto deve possuir uma central de notificações acessível pelo Header.

A central deve:

- Exibir somente as notificações do usuário autenticado.
- Organizar as notificações por data.
- Permitir filtrar por período.
- Carregar notificações antigas por meio do botão “Ver mais”.
- Manter o histórico sem limite de retenção.
- Apresentar estado vazio quando não houver notificações.

Não deve existir filtro separado para notificações lidas e não lidas.

### REQ-07 — Leitura das notificações

Uma notificação deve ser considerada lida quando ficar visível para o usuário.

A leitura deve ser individual. Marcar uma notificação como lida para um usuário não pode alterar o estado dela para outro usuário.

### REQ-08 — Consistência das comunicações

Cada acontecimento relevante deve gerar uma comunicação obrigatória conforme sua definição.

Se a comunicação não puder ser iniciada, a ação que originou a mensagem não deve ser concluída.

Depois de iniciada, a comunicação deve ser processada sem exigir que o usuário permaneça na tela.

### REQ-09 — Histórico e clareza

As mensagens exibidas no produto devem permanecer disponíveis para consulta.

O conteúdo deve ser claro, direto e suficiente para que o usuário entenda:

- O que aconteceu.
- Quando aconteceu.
- Quem foi afetado.
- O que precisa ser feito, quando aplicável.

## User Flow

1. Um acontecimento relevante ocorre em um módulo do Scoops.
2. O sistema identifica os destinatários e os canais adequados.
3. A comunicação é iniciada.
4. O destinatário recebe um e-mail, uma notificação interna ou ambos.
5. A notificação interna aparece no dropdown do Header.
6. O usuário pode abrir a central para consultar o histórico.
7. Ao ficar visível, a notificação é marcada como lida para aquele usuário.
8. O usuário pode filtrar o histórico por data e carregar notificações antigas.

## Out of Scope

- SMS, WhatsApp e push.
- Filtro de lidas e não lidas.
- Limite de retenção do histórico.
- Personalização de mensagens pelo usuário.
- Escolha de canais pelo usuário.
- Painel administrativo para acompanhar status de envio.
- Exibição de tentativas ou falhas técnicas para o usuário.
- Suporte a múltiplos idiomas no MVP.
- E-mails em texto simples no MVP.
