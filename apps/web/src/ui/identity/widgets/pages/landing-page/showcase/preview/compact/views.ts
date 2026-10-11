type CompactPreviewView = {
  title: string
  subtitle: string
  label: string
  value: string
  rows: { label: string; value: string; detail: string }[]
  note: string
}

export const COMPACT_PREVIEW_VIEWS: Record<
  'sales' | 'production' | 'results',
  [CompactPreviewView, CompactPreviewView, CompactPreviewView]
> = {
  sales: [
    {
      title: 'Nova venda',
      subtitle: 'Canal Balcão',
      label: 'Total do pedido',
      value: 'R$ 20,00',
      rows: [
        { label: 'Açaí', value: '300 ml', detail: '1 porção · R$ 20,00' },
        { label: 'Granola', value: 'Incluída', detail: 'Acompanhamento selecionado' },
        { label: 'Leite em pó', value: 'Incluído', detail: 'Acompanhamento selecionado' },
      ],
      note: 'Porção com tamanho e acompanhamentos definidos.',
    },
    {
      title: 'Combo aplicado',
      subtitle: 'Açaí + água',
      label: 'Total com o combo',
      value: 'R$ 22,00',
      rows: [
        { label: 'Açaí 300 ml', value: 'R$ 20,00', detail: 'Granola e leite em pó' },
        { label: 'Água 500 ml', value: 'R$ 5,00', detail: '1 unidade' },
        { label: 'Economia', value: '− R$ 3,00', detail: 'Subtotal: R$ 25,00' },
      ],
      note: 'O desconto do combo é aplicado ao pedido.',
    },
    {
      title: 'Pedidos registrados',
      subtitle: 'Histórico de hoje',
      label: 'Último pedido',
      value: '#1048',
      rows: [
        { label: '#1048 · 15:42', value: 'R$ 22,00', detail: 'Açaí 300 ml + água' },
        { label: '#1047 · 15:36', value: 'R$ 28,00', detail: '2 sorvetes 200 ml' },
        { label: '#1046 · 15:28', value: 'R$ 26,00', detail: 'Açaí 500 ml' },
      ],
      note: 'Itens, preços e descontos preservados no pedido.',
    },
  ],
  production: [
    {
      title: 'Receita de açaí',
      subtitle: 'Rendimento: 1.000 ml',
      label: 'Custo da receita',
      value: 'R$ 6,00',
      rows: [
        { label: 'Polpa de açaí', value: '600 g', detail: 'Custo: R$ 4,80' },
        { label: 'Água', value: '300 ml', detail: 'Custo: R$ 0,30' },
        { label: 'Xarope', value: '100 ml', detail: 'Custo: R$ 0,90' },
      ],
      note: 'Custo por unidade: R$ 0,006 / ml.',
    },
    {
      title: 'Capacidade de produção',
      subtitle: 'Com o estoque disponível',
      label: 'Pode produzir',
      value: '5.000 ml',
      rows: [
        {
          label: 'Polpa de açaí',
          value: '3.000 g',
          detail: 'Limita a produção a 5.000 ml',
        },
        { label: 'Água', value: '3.000 ml', detail: 'Permite produzir 10.000 ml' },
        { label: 'Xarope', value: '800 ml', detail: 'Permite produzir 8.000 ml' },
      ],
      note: 'A polpa é o ingrediente limitante da receita.',
    },
    {
      title: 'Produção registrada',
      subtitle: '2 × rendimento da receita',
      label: 'Entrada no estoque',
      value: '2.000 ml',
      rows: [
        {
          label: 'Polpa de açaí',
          value: '− 1.200 g',
          detail: 'Saldo após produção: 1.800 g',
        },
        { label: 'Água', value: '− 600 ml', detail: 'Saldo após produção: 2.400 ml' },
        { label: 'Xarope', value: '− 200 ml', detail: 'Saldo após produção: 600 ml' },
      ],
      note: 'Estoque do açaí: 500 + 2.000 = 2.500 ml.',
    },
  ],
  results: [
    {
      title: 'Visão das vendas',
      subtitle: 'Últimos 7 dias',
      label: 'Vendas líquidas',
      value: 'R$ 7.500,00',
      rows: [
        { label: 'Pedidos válidos', value: '300', detail: 'No período selecionado' },
        { label: 'Ticket médio', value: 'R$ 25,00', detail: 'Vendas ÷ pedidos válidos' },
        {
          label: 'Sábado',
          value: 'R$ 1.550,00',
          detail: 'Dia com mais vendas no período',
        },
      ],
      note: 'Indicadores de pedidos registrados no Scoops.',
    },
    {
      title: 'Margem bruta estimada',
      subtitle: 'Últimos 7 dias',
      label: 'Margem estimada',
      value: 'R$ 3.600,00',
      rows: [
        {
          label: 'Vendas cobertas',
          value: 'R$ 6.000,00',
          detail: 'Cobertura de custos: 80%',
        },
        {
          label: 'Custo dos itens',
          value: 'R$ 2.400,00',
          detail: '60% de margem sobre vendas cobertas',
        },
        {
          label: 'Sem custo completo',
          value: 'R$ 1.500,00',
          detail: 'Fora da estimativa de margem',
        },
      ],
      note: 'A estimativa não representa lucro líquido.',
    },
    {
      title: 'Estoque agora',
      subtitle: 'Situação atual',
      label: 'Produtos em atenção',
      value: '3',
      rows: [
        { label: 'Água 500 ml', value: '0 un', detail: 'Sem estoque' },
        { label: 'Granola', value: '800 g', detail: 'Abaixo do ideal de 2.000 g' },
        { label: 'Açaí', value: '2.500 ml', detail: 'Produção limitada pela polpa' },
      ],
      note: 'O estoque atual independe do período das vendas.',
    },
  ],
}
