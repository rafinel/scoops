import type { LegalDocument } from '../types/legal-document'

export const TERMS_OF_USE: LegalDocument = {
  title: 'Termos de Uso',
  description:
    'Conheça as condições de acesso ao Scoops e as responsabilidades de quem utiliza a plataforma.',
  route: 'termsOfUse',
  version: '0.1 — minuta',
  updatedAt: '11 de outubro de 2026',
  sections: [
    {
      id: 'sobre-o-scoops',
      title: '1. O que o Scoops oferece',
      paragraphs: [
        'O Scoops é uma plataforma de gestão para sorveterias e lojas de açaí. Seus recursos abrangem equipe e acessos, produtos, ingredientes, receitas, estoque, produção, registro de vendas, histórico de pedidos, indicadores e comunicações operacionais.',
        'O escopo atual não inclui cadastro de consumidores da loja, processamento de pagamentos no ponto de venda, caixa, emissão de documentos fiscais das vendas, operação offline ou exportação de dados. A impressão de um pedido é uma cópia operacional, sem valor fiscal. A cobrança da assinatura do Scoops é independente das vendas do estabelecimento.',
      ],
    },
    {
      id: 'contas-e-acessos',
      title: '2. Contas e acessos da equipe',
      paragraphs: [
        'Cada conta pertence a um estabelecimento e deve ser utilizada pela pessoa identificada no cadastro. O primeiro responsável assume o perfil Gerente. Gerentes administram a equipe e os recursos autorizados; Operadores acessam as funções permitidas ao seu perfil.',
        'O estabelecimento deve manter os dados corretos, proteger suas credenciais e revisar os acessos de sua equipe. Ao desligar uma pessoa, um Gerente deve inativar sua conta. A inativação revoga o acesso e preserva o histórico de autoria; ela não equivale à eliminação de dados pessoais.',
        'O uso em dispositivos compartilhados exige cuidado com sessões abertas. Quem contrata em nome de uma empresa deve possuir autorização para representá-la e responder pela administração do estabelecimento.',
      ],
    },
    {
      id: 'plano-e-assinatura',
      title: '3. Teste, plano e cobrança',
      paragraphs: [
        'A oferta comercial prevista é o plano Scoops Completo por R$ 79,90 por mês, com impostos inclusos, usuários, produtos, pedidos e movimentações ilimitados. O teste gratuito dura 14 dias e não exige cartão de crédito. Esses limites comerciais não dispensam o uso regular da plataforma.',
        'Quando a contratação paga estiver disponível, o checkout informará preço, recorrência, meios de pagamento e condições aplicáveis antes da confirmação. O pagamento confirmado inicia o período mensal contratado. A cobrança recorrente depende da autorização fornecida no fluxo de contratação.',
        'Recursos de assinatura ainda em implementação não devem ser considerados disponíveis apenas por constarem nesta minuta. Alterações de preço serão comunicadas previamente, respeitando a oferta contratada e a legislação aplicável.',
      ],
    },
    {
      id: 'cancelamento-e-reembolso',
      title: '4. Cancelamento e reembolso',
      paragraphs: [
        'O modelo de assinatura previsto permite cancelar a próxima renovação e manter o acesso até o fim do período já pago. O cancelamento comum não prevê reembolso proporcional, sem prejuízo de cobranças indevidas ou outros direitos assegurados por lei.',
        'Está previsto o reembolso integral da primeira mensalidade quando solicitado em até sete dias após o pagamento. O procedimento, o prazo de processamento e os efeitos sobre o acesso serão apresentados quando essa funcionalidade estiver disponível. Esta condição não limita direitos legais de arrependimento ou reparação que sejam aplicáveis.',
        'Cancelar a assinatura, bloquear o acesso e solicitar a eliminação de dados pessoais são procedimentos distintos. O produto atual não oferece exclusão do estabelecimento pela interface; solicitações de privacidade devem utilizar o contato identificado nesta página.',
      ],
    },
    {
      id: 'uso-responsavel',
      title: '5. Uso responsável e dados inseridos',
      paragraphs: [
        'O estabelecimento mantém os direitos sobre os dados que insere e autoriza seu tratamento na medida necessária à prestação do serviço. Deve possuir fundamento legítimo para inserir informações pessoais de sua equipe e informar essas pessoas sobre o uso do Scoops.',
        'Não insira dados pessoais sensíveis ou informações de consumidores nos campos destinados ao cadastro operacional. É proibido acessar dados de outros estabelecimentos, compartilhar credenciais, explorar falhas, prejudicar a disponibilidade ou utilizar a plataforma para atividades ilícitas.',
        'Os registros e indicadores dependem da qualidade das informações cadastradas. O estabelecimento deve conferir receitas, custos, preços e estoque; o Scoops não substitui orientação contábil, fiscal ou profissional.',
      ],
    },
    {
      id: 'disponibilidade-e-responsabilidade',
      title: '6. Disponibilidade e responsabilidades',
      paragraphs: [
        'O serviço depende de conexão à internet e de fornecedores de infraestrutura. Manutenções, falhas e interrupções podem ocorrer. Esta minuta não estabelece disponibilidade contínua nem um acordo específico de nível de serviço.',
        'O Scoops pode restringir acessos diante de uso ilícito, risco à segurança ou descumprimento contratual, com informação ao responsável quando possível. Restrições não afastam os direitos legais dos usuários nem as obrigações de proteção de dados.',
        'Cada parte responde por suas obrigações conforme a legislação aplicável. Estes termos não excluem responsabilidades que não possam ser afastadas por contrato.',
      ],
    },
    {
      id: 'privacidade-e-atualizacoes',
      title: '7. Privacidade e atualizações',
      paragraphs: [
        'A Política de Privacidade explica os dados tratados, suas finalidades e como exercer direitos. A ciência dessa política não representa consentimento genérico para qualquer tratamento.',
        'Mudanças relevantes nestes termos serão informadas pelos canais disponíveis, com identificação da versão e da data. Novas condições não afastam direitos já adquiridos. Para dúvidas sobre o serviço ou esta minuta, utilize os contatos do responsável pelo Scoops apresentados nesta página.',
      ],
    },
  ],
}
