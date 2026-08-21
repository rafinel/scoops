import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import type {
  ProductCatalogPage,
  ProductCategory,
} from '@scoops/core/mrp/domain/structures'
import { ProductSortDirection } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'

import type { ProductsSearch } from '../../../../hooks/use-products-query'
import {
  formatRegisteredDate,
  formatStock,
  useProductsListCard,
} from './use-products-list-card'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_BADGE_CLASSES: Record<ProductCategory, string> = {
  ingredient: 'border-blue-300 bg-blue-50 text-blue-700',
  manufacturable: 'border-violet-300 bg-violet-50 text-violet-700',
  portion: 'border-green-300 bg-green-50 text-green-700',
  accompaniment: 'border-amber-300 bg-amber-50 text-amber-700',
  resale: 'border-red-300 bg-red-50 text-red-700',
}

export function ProductsListCard({
  isError,
  isPending,
  emptyState,
  onFilterOpen,
  onRegisterOpen,
  onRefetch,
  onSearchChange,
  page,
  search,
}: {
  isError: boolean
  isPending: boolean
  emptyState: ReactNode
  onFilterOpen: () => void
  onRegisterOpen: () => void
  onRefetch: () => void
  onSearchChange: (search: ProductsSearch) => void
  page?: ProductCatalogPage
  search: ProductsSearch
}) {
  const { handleSort, sortableColumns } = useProductsListCard({
    onSearchChange,
    search,
  })

  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader className='flex flex-col border-b border-border-soft p-5 sm:flex-row sm:items-center sm:justify-between'>
        <CardTitle className='text-lg font-extrabold'>Lista de produtos</CardTitle>
        <Button
          className='h-9 rounded-lg px-4 font-bold shadow-primary'
          onClick={onRegisterOpen}
        >
          <Icon name='plus' className='size-4' /> Novo produto
        </Button>
      </CardHeader>
      <CardContent className='space-y-0 p-0'>
        <div className='flex flex-col gap-3 border-b border-border-soft p-4 sm:flex-row'>
          <Label className='flex min-h-9 flex-1 items-center gap-2 rounded-xl border bg-muted/30 px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <Icon name='search' className='size-4 text-muted-foreground' />
            <Input
              aria-label='Buscar produtos'
              className='border-0 px-0 shadow-none focus:border-transparent focus:outline-0 focus:outline-none focus:shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:border-transparent focus-visible:outline-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
              data-focus-ring='delegated'
              onChange={(event) =>
                onSearchChange({ ...search, search: event.target.value, page: 1 })
              }
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
            {filterCount(search) > 0 ? ` (${filterCount(search)})` : ''}
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
          onPageChange={(pageNumber) => onSearchChange({ ...search, page: pageNumber })}
          pageSize={10}
          totalItems={page?.total ?? 0}
        />
      </CardContent>
    </Card>
  )
}

function filterCount(search: ProductsSearch) {
  return (
    Number(search.categories.length > 0) +
    Number(search.status !== undefined) +
    Number(search.stockSituation !== undefined)
  )
}

function ProductTable({
  onSort,
  page,
  search,
  sortableColumns,
}: {
  onSort: (field: ProductsSearch['sortBy']) => void
  page: ProductCatalogPage
  search: ProductsSearch
  sortableColumns: Array<{
    field: ProductsSearch['sortBy']
    label: string
    className?: string
    align?: 'left' | 'right'
  }>
}) {
  return (
    <Table className='min-w-0 table-fixed text-left'>
      <TableCaption className='sr-only'>Produtos cadastrados</TableCaption>
      <TableHeader className='bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground [&_tr]:border-0'>
        <TableRow className='border-0 hover:bg-transparent'>
          {sortableColumns.map(({ align = 'left', className, field, label }) => {
            const isActive = search.sortBy === field
            const direction = isActive ? search.sortDirection : undefined
            const icon = !isActive
              ? 'arrow-down-up'
              : direction === ProductSortDirection.Ascending
                ? 'arrow-up'
                : 'arrow-down'

            return (
              <TableHead
                aria-sort={
                  isActive
                    ? direction === ProductSortDirection.Ascending
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className={cn('h-auto px-5 py-3', className)}
                key={field}
              >
                <Button
                  aria-label={`Ordenar por ${label}`}
                  className={cn(
                    'h-auto w-full justify-start gap-1.5 border-0 bg-transparent px-0 py-0 transition-colors hover:bg-transparent hover:text-foreground focus-visible:rounded-sm',
                    align === 'right' && 'justify-end',
                    isActive && 'text-foreground',
                  )}
                  onClick={() => onSort(field)}
                  type='button'
                  variant='ghost'
                >
                  {label}
                  <Icon name={icon} className='size-3.5 shrink-0' />
                </Button>
              </TableHead>
            )
          })}
          <TableHead className='hidden h-auto px-5 py-3 sm:table-cell'>
            <span className='sr-only'>Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className='divide-y'>
        {page.items.map(({ product, brandCount, stockQuantity, stockSituation }) => (
          <TableRow
            className={cn(
              'border-0 hover:bg-transparent',
              stockSituation === 'low' ? 'bg-red-50/70' : 'bg-card',
            )}
            key={product.id}
          >
            <TableCell className='min-w-0 overflow-hidden px-5 py-3.5 font-bold'>
              <span className='flex min-w-0 items-center gap-2'>
                {stockSituation === 'low' ? (
                  <span className='size-1.5 shrink-0 rounded-full bg-red-600' />
                ) : null}
                <span className='min-w-0 truncate' title={product.name}>
                  {product.name}
                </span>
              </span>
            </TableCell>
            <TableCell className='min-w-0 overflow-hidden px-5 py-3.5'>
              <div className='flex min-w-0 flex-wrap gap-1'>
                {product.categories.map((category) => (
                  <Badge
                    className={`h-6 px-2.5 py-1 text-xs font-semibold ${CATEGORY_BADGE_CLASSES[category]}`}
                    key={category}
                    variant='outline'
                  >
                    {CATEGORY_LABELS[category]}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className='px-5 py-3.5 text-muted-foreground'>
              {product.unit}
            </TableCell>
            <TableCell className='hidden px-5 py-3.5 text-muted-foreground lg:table-cell'>
              <time dateTime={product.createdAt.toISOString()}>
                {formatRegisteredDate(product.createdAt)}
              </time>
            </TableCell>
            <TableCell className='hidden px-5 py-3.5 text-muted-foreground sm:table-cell'>
              {brandCount > 0 ? brandCount : '—'}
            </TableCell>
            <TableCell
              className={cn(
                'px-5 py-3.5 text-right font-bold',
                stockSituation === 'low' && 'text-red-700',
              )}
            >
              <div>{formatStock(stockQuantity, product.unit)}</div>
              {product.idealStock !== undefined ? (
                <div className='text-xs font-normal text-muted-foreground'>
                  meta: {formatStock(product.idealStock, product.unit)}
                </div>
              ) : null}
            </TableCell>
            <TableCell className='hidden px-5 py-3.5 sm:table-cell'>
              <Link
                className='whitespace-nowrap text-sm font-semibold text-primary hover:underline'
                params={{ productId: product.id }}
                to='/products/$productId'
              >
                Detalhes →
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
