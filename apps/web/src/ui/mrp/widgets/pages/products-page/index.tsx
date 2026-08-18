import type { ProductsSearch } from '../../../hooks/use-products-query'
import { ProductFiltersDialog } from './product-filters-dialog'
import { ProductsEmptyState } from './products-empty-state'
import { ProductsKpiCards } from './products-kpi-cards'
import { ProductsListCard } from './products-list-card'
import { ProductRegistrationDialog } from './product-registration-dialog'
import { useProductsPage } from './use-products-page'

export type ProductsPageProps = {
  search: ProductsSearch
  onSearchChange: (search: ProductsSearch) => void
}

export function ProductsPage({ search, onSearchChange }: ProductsPageProps) {
  const {
    handleEmptyStateClear,
    handleFilterOpenChange,
    handleOpenFilter,
    handleRegisterOpenChange,
    isFilterOpen,
    isRegisterOpen,
    query,
  } = useProductsPage({ onSearchChange, search })

  const hasFilters = Boolean(
    search.search || search.categories.length || search.status || search.stockSituation,
  )

  return (
    <section className='min-w-0 max-w-full space-y-6 overflow-hidden'>
      <div>
        <p className='text-sm font-semibold text-muted-foreground'>
          Estoque &gt; Produtos
        </p>
        <h1 className='mt-2 text-3xl font-black tracking-tight sm:text-4xl'>Produtos</h1>
        <p className='mt-2 max-w-xl text-sm text-muted-foreground'>
          Cadastre e acompanhe seus produtos, marcas e categorias.
        </p>
      </div>

      <ProductsKpiCards page={query.data} isLoading={query.isLoading} />
      <ProductsListCard
        emptyState={
          <ProductsEmptyState hasFilters={hasFilters} onClear={handleEmptyStateClear} />
        }
        isError={query.isError}
        isPending={query.isPending}
        onFilterOpen={handleOpenFilter}
        onRefetch={() => query.refetch()}
        onRegisterOpen={() => handleRegisterOpenChange(true)}
        onSearchChange={onSearchChange}
        page={query.data}
        search={search}
      />
      <ProductFiltersDialog
        isOpen={isFilterOpen}
        onOpenChange={handleFilterOpenChange}
        onSearchChange={onSearchChange}
        search={search}
      />
      <ProductRegistrationDialog
        isOpen={isRegisterOpen}
        onOpenChange={handleRegisterOpenChange}
        onSuccess={() => handleRegisterOpenChange(false)}
      />
    </section>
  )
}

export type { ProductsSearch }
