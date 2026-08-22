import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'
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

export const ProductsPage = ({ search, onSearchChange }: ProductsPageProps) => {
  const {
    hasProductsError,
    hasFilters,
    isFilterOpen,
    isLoadingProducts,
    isRegisterOpen,
    isPendingProducts,
    productsPage,
    handleEmptyStateClear,
    handleFilterOpenChange,
    handleOpenFilter,
    handleRegisterOpenChange,
    refetchProducts,
  } = useProductsPage({ onSearchChange, search })

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

      <ProductsKpiCards page={productsPage} isLoading={isLoadingProducts} />
      <ProductsListCard
        emptyState={
          <ProductsEmptyState hasFilters={hasFilters} onClear={handleEmptyStateClear} />
        }
        isError={hasProductsError}
        isPending={isPendingProducts}
        onFilterOpen={handleOpenFilter}
        onRefetch={() => refetchProducts()}
        onRegisterOpen={() => handleRegisterOpenChange(true)}
        onSearchChange={onSearchChange}
        page={productsPage}
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
