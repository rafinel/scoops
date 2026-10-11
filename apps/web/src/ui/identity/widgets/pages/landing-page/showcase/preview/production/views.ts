import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'

import type { PreviewMetricProps } from '../metric'

type ProductionPreviewRow = {
  name: string
  quantity: string
  result: string
  className?: string
}

type ProductionPreviewView = {
  title: string
  metrics: PreviewMetricProps[]
  rowsTitle: string
  rowsDetail: string
  quantityLabel: string
  resultLabel: string
  rows: ProductionPreviewRow[]
  icon: IconName
  note: string
}

const RECIPE_YIELD = {
  label: 'Rendimento da receita',
  value: '1.000 ml',
  detail: 'Por rendimento de referência',
}
const UNIT_COST = {
  label: 'Custo por unidade',
  value: 'R$ 0,006 / ml',
  detail: 'Custo da receita ÷ rendimento',
}

export const PRODUCTION_PREVIEW_VIEWS: [
  ProductionPreviewView,
  ProductionPreviewView,
  ProductionPreviewView,
] = [
  {
    title: 'Receita e produção',
    metrics: [
      RECIPE_YIELD,
      {
        label: 'Custo da receita',
        value: 'R$ 6,00',
        detail: 'Ingredientes para 1.000 ml',
      },
      UNIT_COST,
    ],
    rowsTitle: 'Ingredientes da receita',
    rowsDetail: '3 ingredientes',
    quantityLabel: 'Quantidade / receita',
    resultLabel: 'Custo / receita',
    rows: [
      { name: 'Polpa de açaí', quantity: '600 g', result: 'R$ 4,80' },
      { name: 'Água', quantity: '300 ml', result: 'R$ 0,30' },
      { name: 'Xarope', quantity: '100 ml', result: 'R$ 0,90' },
    ],
    icon: 'info',
    note: 'Quantidades e custos conectados à receita do produto.',
  },
  {
    title: 'Receita e produção',
    metrics: [
      RECIPE_YIELD,
      {
        label: 'Capacidade disponível',
        value: '5.000 ml',
        detail: 'Limitada pela polpa de açaí',
      },
      UNIT_COST,
    ],
    rowsTitle: 'Ingredientes da receita',
    rowsDetail: '3 ingredientes',
    quantityLabel: 'Estoque disponível',
    resultLabel: 'Permite produzir',
    rows: [
      {
        name: 'Polpa de açaí',
        quantity: '3.000 g',
        result: '5.000 ml',
        className: 'bg-primary-soft',
      },
      { name: 'Água', quantity: '3.000 ml', result: '10.000 ml' },
      { name: 'Xarope', quantity: '800 ml', result: '8.000 ml' },
    ],
    icon: 'info',
    note: 'A polpa é o ingrediente que limita a capacidade atual.',
  },
  {
    title: 'Produção registrada',
    metrics: [
      {
        label: 'Quantidade produzida',
        value: '2.000 ml',
        detail: '2 × rendimento da receita',
      },
      {
        label: 'Estoque do açaí',
        value: '2.500 ml',
        detail: '500 ml anteriores + 2.000 ml',
      },
      {
        label: 'Custo da produção',
        value: 'R$ 12,00',
        detail: '2 × R$ 6,00 por receita',
      },
    ],
    rowsTitle: 'Consumo de ingredientes',
    rowsDetail: 'Atualização de estoque',
    quantityLabel: 'Consumo',
    resultLabel: 'Após produção',
    rows: [
      { name: 'Polpa de açaí', quantity: '1.200 g', result: '1.800 g' },
      { name: 'Água', quantity: '600 ml', result: '2.400 ml' },
      { name: 'Xarope', quantity: '200 ml', result: '600 ml' },
    ],
    icon: 'circle-check',
    note: 'Consumo registrado junto à entrada do produto no estoque.',
  },
]
