import type {
  ProductCategory,
  ProductCatalogPage,
} from '@scoops/core/mrp/domain/structures'
import { ProductSortDirection } from '@scoops/core/mrp/domain/structures'

import { CATEGORY_ICONS } from '@/constants'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/shadcn/tooltip'
import { useFormatDate, useFormatQuantity } from '@/ui/shared/hooks/use-formatters'
import { cn } from '@/ui/shared/lib/utils'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'

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

export type ProductTableProps = {
  onSort: (field: ProductsSearch['sortBy']) => void
  page: ProductCatalogPage
  search: ProductsSearch
  sortableColumns: Array<{
    field: ProductsSearch['sortBy']
    label: string
    className?: string
    align?: 'left' | 'right'
  }>
}

export const ProductTable = ({
  onSort,
  page,
  search,
  sortableColumns,
}: ProductTableProps) => {
  const formatQuantity = useFormatQuantity()
  const formatDate = useFormatDate()

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
      <TooltipProvider delay={300}>
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
                <div className='flex min-w-0 flex-wrap gap-1.5'>
                  {product.categories.map((category) => (
                    <Tooltip key={category}>
                      <TooltipTrigger
                        aria-label={CATEGORY_LABELS[category]}
                        className='rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      >
                        <Badge
                          className={`size-8 p-0 ${CATEGORY_BADGE_CLASSES[category]}`}
                          variant='outline'
                        >
                          <Icon name={CATEGORY_ICONS[category]} className='size-4' />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{CATEGORY_LABELS[category]}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
              <TableCell className='px-5 py-3.5 text-muted-foreground'>
                {product.unit}
              </TableCell>
              <TableCell className='hidden px-5 py-3.5 text-muted-foreground lg:table-cell'>
                <time dateTime={product.createdAt.toISOString()}>
                  {formatDate(product.createdAt, {
                    dateStyle: 'short',
                    timeZone: 'America/Sao_Paulo',
                  })}
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
                <div>{formatQuantity(stockQuantity, product.unit)}</div>
                {product.idealStock !== undefined ? (
                  <div className='text-xs font-normal text-muted-foreground'>
                    meta: {formatQuantity(product.idealStock, product.unit)}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className='hidden px-5 py-3.5 sm:table-cell'>
                <Anchor
                  className='whitespace-nowrap text-sm font-semibold text-primary hover:underline'
                  params={{ productId: product.id }}
                  route='productDetails'
                >
                  Detalhes →
                </Anchor>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TooltipProvider>
    </Table>
  )
}
