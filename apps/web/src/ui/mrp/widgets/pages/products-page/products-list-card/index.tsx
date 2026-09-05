import type { ReactNode } from 'react'

import type { ProductCatalogPage } from '@scoops/core/mrp/domain/structures'

import { buttonVariants } from '@/ui/shadcn/button'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'
import { cn } from '@/ui/shared/lib/utils'

import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'
import { ProductTable } from './product-table'
import { useProductsListCard } from './use-products-list-card'

export type ProductsListCardProps = {
  canManageProducts: boolean
  isError: boolean
  isPending: boolean
  emptyState: ReactNode
  onFilterOpen: () => void
  onRefetch: () => void
  onSearchChange: (search: ProductsSearch) => void
  page?: ProductCatalogPage
  search: ProductsSearch
}

export const ProductsListCard = ({
  canManageProducts,
  isError,
  isPending,
  emptyState,
  onFilterOpen,
  onRefetch,
  onSearchChange,
  page,
  search,
}: ProductsListCardProps) => {
  const { filterCount, handlePageChange, handleSearch, handleSort, sortableColumns } =
    useProductsListCard({
      onSearchChange,
      search,
    })

  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader className='flex flex-col border-b border-border-soft p-5 sm:flex-row sm:items-center sm:justify-between'>
        <CardTitle className='text-lg font-extrabold'>Lista de produtos</CardTitle>
        {canManageProducts ? (
          <Anchor
            className={cn(
              buttonVariants({ variant: 'default' }),
              'h-9 rounded-lg px-4 font-bold shadow-primary',
            )}
            route='newProduct'
          >
            <Icon name='plus' className='size-4' /> Novo produto
          </Anchor>
        ) : null}
      </CardHeader>
      <CardContent className='space-y-0 p-0'>
        <div className='flex flex-col gap-3 border-b border-border-soft p-4 sm:flex-row'>
          <Label className='flex min-h-9 flex-1 items-center gap-2 rounded-xl border bg-muted/30 px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <Icon name='search' className='size-4 text-muted-foreground' />
            <Input
              aria-label='Buscar produtos'
              className='border-0 px-0 shadow-none focus:border-transparent focus:outline-0 focus:outline-none focus:shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:border-transparent focus-visible:outline-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
              data-focus-ring='delegated'
              onChange={(event) => handleSearch(event.target.value)}
              placeholder='Buscar produto...'
              value={search.search}
            />
          </Label>
          <Button
            aria-haspopup='dialog'
            className='min-h-9 justify-center rounded-xl px-4 sm:min-w-28'
            onClick={onFilterOpen}
            variant='outline'
          >
            <Icon name='filter' className='size-4' /> Filtros
            {filterCount > 0 ? ` (${filterCount})` : ''}
          </Button>
        </div>

        {isPending ? (
          <p className='py-10 text-center text-muted-foreground'>
            Carregando produtos...
          </p>
        ) : null}
        {isError ? (
          <div className='m-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center'>
            <p className='font-bold'>Não foi possível carregar os produtos.</p>
            <Button className='mt-3' onClick={onRefetch} variant='outline'>
              Tentar novamente
            </Button>
          </div>
        ) : null}
        {!isPending && !isError && page?.items.length === 0 ? emptyState : null}
        {page && !isPending && !isError && page.items.length > 0 ? (
          <ProductTable
            page={page}
            search={search}
            sortableColumns={sortableColumns}
            onSort={handleSort}
          />
        ) : null}
        <Pagination
          currentPage={search.page}
          itemLabel='produtos'
          onPageChange={handlePageChange}
          pageSize={10}
          totalItems={page?.total ?? 0}
        />
      </CardContent>
    </Card>
  )
}
