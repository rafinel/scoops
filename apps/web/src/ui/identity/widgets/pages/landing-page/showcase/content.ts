export const SHOWCASE_PANELS = [
  {
    kind: 'sales',
    title: 'Vendas no ritmo do balcão.',
    description: 'Monte porções, revise o pedido e registre a venda em um só fluxo.',
    features: [
      {
        title: 'Tamanhos e acompanhamentos',
        description: 'Configure cada porção antes de adicionar ao pedido.',
      },
      {
        title: 'Combos automáticos',
        description: 'O Scoops aplica a combinação de ofertas com maior economia.',
      },
      {
        title: 'Estoque conectado',
        description:
          'A venda registrada atualiza o consumo dos produtos e acompanhamentos.',
      },
    ],
  },
  {
    kind: 'production',
    title: 'Saiba o que pode produzir.',
    description:
      'Veja o custo da receita e a capacidade de produção com os ingredientes disponíveis.',
    features: [
      {
        title: 'Receitas e rendimentos',
        description: 'Organize ingredientes e quantidades para cada produção.',
      },
      {
        title: 'Capacidade com o estoque atual',
        description: 'Identifique o ingrediente que limita a produção.',
      },
      {
        title: 'Consumo e entrada juntos',
        description:
          'Ao registrar a produção, os ingredientes saem e o produto produzido entra no estoque.',
      },
    ],
  },
  {
    kind: 'results',
    title: 'Entenda os resultados.',
    description:
      'Acompanhe as vendas do período e os produtos que precisam da sua atenção.',
    features: [
      {
        title: 'Vendas, pedidos e ticket médio',
        description: 'Compare o período escolhido com o anterior.',
      },
      {
        title: 'Margem bruta estimada',
        description: 'Veja a estimativa e a cobertura dos custos registrados na venda.',
      },
      {
        title: 'Estoque agora',
        description:
          'Identifique produtos sem estoque, abaixo do ideal ou com produção limitada.',
      },
    ],
  },
] as const

export type ShowcasePanelContent = (typeof SHOWCASE_PANELS)[number]
