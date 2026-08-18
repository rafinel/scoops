import type { ProductCatalogPage } from '@scoops/core/mrp/domain/structures'

export function useProductsKpiCards(
  page: ProductCatalogPage | undefined,
  isLoading: boolean,
) {
  return [
    {
      label: 'Produtos',
      value: page?.kpis.products ?? 0,
      icon: 'package' as const,
      railColor: 'var(--primary)',
      iconTone: 'bg-accent text-primary',
      valueTone: 'text-foreground',
      detail: 'na lista atual',
    },
    {
      label: 'Marcas',
      value: page?.kpis.brands ?? 0,
      icon: 'tags' as const,
      railColor: 'var(--info)',
      iconTone: 'bg-info-soft text-info',
      valueTone: 'text-foreground',
      detail: 'vinculadas',
    },
    {
      label: 'Estoque baixo',
      value: page?.kpis.lowStock ?? 0,
      icon: 'triangle-alert' as const,
      railColor: 'var(--destructive)',
      iconTone: 'bg-danger-soft text-danger',
      valueTone: 'text-danger',
      detail: 'precisam repor',
    },
  ].map((card) => ({ ...card, displayValue: isLoading ? '—' : card.value }))
}
