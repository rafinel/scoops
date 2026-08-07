---
description: Visão arquitetural de alto nível do produto Scoops.
---

# Arquitetura do Scoops

Este documento apresenta a visão arquitetural do Scoops. Detalhes de código,
estrutura de pastas, contratos, testes e configuração pertencem às regras e
documentações técnicas específicas.

## 1. Visão geral

O Scoops é um SaaS para sorveterias e açaiterias. A arquitetura deve suportar
múltiplos estabelecimentos, mantendo separados os dados, usuários, operações e
permissões de cada estabelecimento.

O sistema é organizado em camadas de experiência, aplicação, domínio, dados e
integrações. O backend é a autoridade para autenticação, autorização, regras de
negócio, consistência e persistência.

## 2. Princípios arquiteturais

- Separar apresentação, aplicação, domínio, persistência e infraestrutura.
- Garantir isolamento entre estabelecimentos em todas as operações de negócio.
- Centralizar no backend as decisões de negócio e de autorização.
- Tratar operações críticas como transações atômicas.
- Isolar provedores externos atrás de fronteiras próprias.
- Preservar históricos operacionais por meio de registros imutáveis quando necessário.
- Manter módulos coesos e com baixo acoplamento entre si.
- Considerar responsividade, acessibilidade e observabilidade como requisitos estruturais.

## 3. Stack tecnológico

| Área | Tecnologia | Responsabilidade arquitetural |
| --- | --- | --- |
| Linguagem | TypeScript | Linguagem comum entre aplicação web, backend e domínio compartilhado. |
| Monorepo | pnpm e Turborepo | Gerenciamento de workspaces, dependências e execução coordenada das aplicações. |
| Aplicação web | React e TanStack Start | Construção da experiência web e renderização da aplicação. |
| Roteamento web | TanStack Router | Organização da navegação e dos fluxos da aplicação web. |
| Build web | Vite | Desenvolvimento local, empacotamento e execução da aplicação web. |
| Interface visual | Tailwind CSS e shadcn/ui | Estilização, tokens e componentes reutilizáveis da interface. |
| Backend | NestJS sobre Node.js | API, composição dos módulos e execução dos casos de uso. |
| Contrato da API | REST e OpenAPI/Swagger | Comunicação HTTP entre a aplicação web e o backend. |
| Domínio compartilhado | Pacote `@scoops/core` | Regras, entidades e contratos de negócio independentes de infraestrutura. |
| Persistência | PostgreSQL e Drizzle ORM | Armazenamento transacional, consultas e evolução do modelo de dados. |
| Identidade | Supabase Auth | Autenticação e identidade dos usuários da plataforma. |
| Processamento assíncrono | Inngest | Eventos, tarefas assíncronas, reprocessamento e coordenação de processos. |
| Cobrança | Asaas | Planos, pagamentos e eventos relacionados à situação comercial. |
| Comunicação | Resend e React Email | Entrega e composição de e-mails transacionais. |
| Qualidade de código | Biome e TypeScript | Formatação, linting e verificação estática do código. |

Essas tecnologias formam a base do produto. Provedores adicionais devem ser
introduzidos atrás das fronteiras dos módulos, sem acoplar as regras de negócio
a uma implementação externa específica.

## 4. Visão do sistema

```text
Usuário
  ↓
Aplicação Web
  ↓
API da Aplicação
  ↓
Núcleo de Domínio
  ↓
Banco de Dados e Integrações
```

A aplicação web concentra a experiência e a interação com o usuário. A API
coordena os casos de uso. O domínio define as regras do produto. O banco de
dados e os serviços externos fornecem capacidades técnicas, sem assumir as
decisões centrais do negócio.

## 5. Aplicação Web

A aplicação web oferece as experiências de autenticação, onboarding,
administração de usuários, assinatura, catálogo, estoque, produção, vendas e
comunicação.

Ela pode controlar estado de interface e fornecer feedback imediato, mas não é
a autoridade final para validar permissões, preços, disponibilidade de estoque
ou conclusão de operações.

## 6. Backend e domínio

O backend é responsável por:

- expor a API da aplicação;
- autenticar e autorizar usuários;
- executar casos de uso;
- aplicar regras e invariantes de negócio;
- coordenar transações;
- persistir dados;
- publicar eventos relevantes;
- integrar serviços externos.

As regras de domínio devem permanecer independentes de frameworks, bancos de
dados e provedores externos. Isso permite evoluir a infraestrutura sem alterar
o significado das operações do produto.

## 7. Módulos de negócio

### Identity

Cuida da identidade da plataforma: estabelecimentos, usuários, perfis,
status, autenticação, acesso e auditoria relacionada à identidade.

O modelo utiliza `User` como entidade de acesso ao estabelecimento. No MVP,
um usuário pertence a um estabelecimento, e o identificador do usuário é o
mesmo fornecido pelo provedor de autenticação.

### Billing

Cuida da relação comercial entre o estabelecimento e o Scoops: oferta, período
de teste, contratação, assinatura, cobranças recorrentes, documentos fiscais,
inadimplência, cancelamento, reativação e disponibilidade comercial do produto.

Billing mantém o ciclo de vida da assinatura e determina o nível de acesso
comercial do estabelecimento. Integrações com provedores de pagamento e de
documentos fiscais pertencem a essa fronteira, mas não definem as regras de
negócio do módulo.

Pagamentos realizados pelos clientes do estabelecimento, caixa, troco,
conciliação de vendas e documentos fiscais de pedidos pertencem ao PDV ou a
outros módulos operacionais. Billing não deve assumir essas responsabilidades.

### MRP

Cuida de produtos, categorias, marcas, estoque, fichas técnicas, produção e
complementos.

### PDV

Cuida de vendas, canais, pedidos, combos, consumo de estoque e histórico das
operações de venda.

### Communication

Cuida de notificações e comunicações originadas por outros módulos, mantendo
separadas as regras de entrega dos eventos de negócio que as motivam.

## 8. Identidade e autorização

O Supabase Auth atua como provedor de identidade. A aplicação web utiliza o
provedor para a experiência de autenticação, enquanto o backend valida a
identidade recebida e consulta o estado local do usuário, seu perfil e seu
estabelecimento.

Há duas preocupações complementares:

1. verificar se a requisição é feita por uma identidade autenticada;
2. verificar se essa identidade pode executar a operação solicitada.

A aplicação web pode adaptar sua navegação conforme o perfil, mas isso não
substitui a autorização aplicada pelo backend.

## 9. Dados e consistência

O PostgreSQL é acessado exclusivamente pelo backend. O isolamento por
estabelecimento é uma responsabilidade obrigatória das operações de negócio e
da persistência; Row-Level Security não faz parte da primeira versão da
arquitetura.

Operações como produção, venda e baixa de estoque devem preservar a
consistência entre o fato registrado, o saldo de estoque e o histórico. Uma
operação parcialmente concluída não é válida para o sistema.

Pedidos e outros registros operacionais devem preservar os dados relevantes do
momento em que foram realizados, mesmo quando o catálogo ou a configuração
posteriormente mudar.

## 10. Eventos e integrações

Os módulos se comunicam por meio de eventos de negócio quando uma mudança puder
ser consumida por outro módulo ou por um processo assíncrono. O processamento
deve considerar reprocessamento, falhas e observabilidade.

A publicação de eventos relevantes faz parte da operação que os origina. Os
eventos seguem uma convenção de nome baseada no módulo, recurso e ação, por
exemplo `identity/user.created`.

As principais integrações previstas são:

- Supabase Auth para identidade;
- Asaas para cobrança;
- Resend e React Email para comunicação por e-mail;
- Inngest para processamento assíncrono e coordenação de eventos.

Integrações futuras, como IA, WhatsApp, assinatura eletrônica e RLS para as
tabelas de negócio, devem ser introduzidas por módulos próprios quando houver
necessidade validada.

## 11. Qualidade e operação

A qualidade deve ser verificada em diferentes níveis: regras de negócio,
integração com persistência, comportamento da API e fluxos críticos da
aplicação web.

O sistema deve manter ambientes separados, migrações versionadas,
observabilidade das operações relevantes e um processo automatizado de entrega.

Autenticação, onboarding, autorização, estoque, produção, vendas e cobrança
são áreas prioritárias para testes e monitoramento por afetarem diretamente a
integridade do produto.

## 12. Evolução planejada

1. Fundação da plataforma e Identity.
2. Billing e controle de acesso comercial.
3. MRP e gestão de estoque e produção.
4. PDV e operações de venda.
5. Communication e automações relacionadas.
6. Observabilidade avançada, performance e integrações adicionais.

Cada nova capacidade deve ser adicionada ao módulo responsável, expondo apenas
as fronteiras necessárias para os demais módulos.

## 13. Documentos relacionados

- [PRDs](./prd/)
- [Regras do pacote core](./rules/core-package-rules.md)
- [Regras do pacote server](./rules/server-package-rules.md)
- [Regras do pacote web](./rules/web-package-rules.md)
- [Regras de qualidade](./rules/quality-rules.md)
