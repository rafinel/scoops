export type LandingFaqQuestion = {
  id: 'trial' | 'plan' | 'team' | 'operation'
  question: string
  title: string
  paragraphs: readonly string[]
}

export const LANDING_FAQ_QUESTIONS: readonly LandingFaqQuestion[] = [
  {
    id: 'trial',
    question: 'Preciso de cartão para testar?',
    title: 'Teste primeiro, sem cartão.',
    paragraphs: [
      'Você tem 14 dias grátis para conhecer o Scoops, sem cadastrar cartão de crédito ou fazer um pagamento antecipado.',
      'O período de teste começa quando você confirma seu e-mail.',
    ],
  },
  {
    id: 'plan',
    question: 'O que está incluído nos R$ 79,90/mês?',
    title: 'Tudo incluído, sem limites de uso.',
    paragraphs: [
      'O Scoops Completo custa R$ 79,90 por mês, com impostos inclusos e todos os recursos em uma única assinatura.',
      'Usuários, produtos, pedidos e movimentações são ilimitados.',
    ],
  },
  {
    id: 'team',
    question: 'Posso cadastrar toda a minha equipe?',
    title: 'Cada pessoa, seu próprio acesso.',
    paragraphs: [
      'Sim. Você pode cadastrar usuários ilimitados, cada um com uma conta individual.',
      'Os perfis de Gerente e Operador definem os acessos de cada pessoa na operação.',
    ],
  },
  {
    id: 'operation',
    question: 'Como estoque, produção e vendas se conectam?',
    title: 'Um fluxo conectado.',
    paragraphs: [
      'As receitas indicam os ingredientes necessários. Ao registrar a produção, o Scoops desconta esses ingredientes e adiciona o produto fabricado ao estoque.',
      'Ao confirmar e registrar a venda, o estoque dos produtos e acompanhamentos selecionados é atualizado junto.',
    ],
  },
]
