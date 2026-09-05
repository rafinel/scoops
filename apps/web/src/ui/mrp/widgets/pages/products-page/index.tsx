import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ProductFiltersDialog } from './product-filters-dialog'
import { ProductsEmptyState } from './products-empty-state'
import { ProductsKpiCards } from './products-kpi-cards'
import { ProductsListCard } from './products-list-card'
import { useProductsPage } from './use-products-page'

export type ProductsPageProps = {
  search: ProductsSearch
  onSearchChange: (search: ProductsSearch) => void
}

export const ProductsPage = ({ search, onSearchChange }: ProductsPageProps) => {
  const {
    canManageProducts,
    canManageTypes,
    hasProductsError,
    hasFilters,
    isFilterOpen,
    isLoadingProducts,
    isPendingProducts,
    productsPage,
    handleEmptyStateClear,
    handleFilterOpenChange,
    handleOpenFilter,
    refetchProducts,
  } = useProductsPage({ onSearchChange, search })

  return (
    <section className='min-w-0 max-w-full space-y-6 overflow-hidden'>
      <div>
        <h1 className='mt-2 text-3xl font-black tracking-tight sm:text-4xl'>Produtos</h1>
        <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-2'>
          <p className='max-w-xl text-sm text-muted-foreground'>
            Cadastre e acompanhe seus produtos, marcas e categorias.
          </p>
          {canManageTypes ? (
            <Anchor
              className='inline-flex min-h-8 items-center gap-1 text-sm font-bold text-primary hover:underline'
              route='accompanimentTypes'
            >
              <Icon name='tag' className='size-4' /> Tipos de acompanhamento
            </Anchor>
          ) : null}
        </div>
      </div>

      <ProductsKpiCards page={productsPage} isLoading={isLoadingProducts} />
      <ProductsListCard
        emptyState={
          <ProductsEmptyState hasFilters={hasFilters} onClear={handleEmptyStateClear} />
        }
        isError={hasProductsError}
        isPending={isPendingProducts}
        canManageProducts={canManageProducts}
        onFilterOpen={handleOpenFilter}
        onRefetch={() => refetchProducts()}
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
    </section>
  )
}

export type { ProductsSearch }
