export function useProductsEmptyState(hasFilters: boolean) {
  return {
    title: hasFilters ? 'Nenhum produto encontrado' : 'Seu catálogo está vazio',
    description: hasFilters
      ? 'Tente ajustar os filtros para encontrar outros produtos.'
      : 'Cadastre seu primeiro produto para começar a acompanhar o estoque.',
  }
}
