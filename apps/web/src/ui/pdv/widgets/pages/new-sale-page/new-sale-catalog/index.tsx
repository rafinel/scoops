import type {
  SaleItemKind,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

import { CATEGORY_ICONS } from '@/constants/product-category-icons'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { cn } from '@/ui/shared/lib/utils'

import { useNewSaleCatalog } from './use-new-sale-catalog'

export type NewSaleCatalogProps = {
  addedProductIds: readonly string[]
  onSelectProduct: (product: SalesCatalogProduct) => void
}

const KIND_LABELS: Record<SaleItemKind | 'all', string> = {
  all: 'Todos',
  portion: 'Porções',
  resale: 'Revendas',
}

export const NewSaleCatalog = (props: NewSaleCatalogProps) => {
  const formatCurrency = useFormatCurrency()
  const {
    catalogPage,
    handleClearFilters,
    handleKindChange,
    handlePageChange,
    handleSearchChange,
    handleSelectProduct,
    isCatalogError,
    isLoadingCatalog,
    kind,
    refetchCatalog,
    search,
  } = useNewSaleCatalog({ onSelectProduct: props.onSelectProduct })

  return (
    <section aria-labelledby='new-sale-products-title' className='min-w-0'>
      <div className='mb-4 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h2 className='text-lg font-extrabold' id='new-sale-products-title'>
            Produtos
          </h2>
          <p className='text-sm text-muted-foreground'>
            {catalogPage
              ? `${catalogPage.total} produtos elegíveis · ${props.addedProductIds.length} adicionados`
              : 'Selecione um produto para começar'}
          </p>
        </div>
        <fieldset aria-label='Filtrar por tipo' className='flex gap-2'>
          {(['all', 'portion', 'resale'] as const).map((value) => (
            <Button
              aria-pressed={(kind ?? 'all') === value}
              className={cn(
                'h-9 rounded-lg px-3 text-xs sm:px-4',
                (kind ?? 'all') === value && 'shadow-tab',
              )}
              key={value}
              onClick={() => handleKindChange(value === 'all' ? undefined : value)}
              type='button'
              variant={(kind ?? 'all') === value ? 'default' : 'outline'}
            >
              {KIND_LABELS[value]}
            </Button>
          ))}
        </fieldset>
      </div>

      <label
        className='flex h-12 items-center gap-3 rounded-xl border bg-card px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
        htmlFor='new-sale-search'
      >
        <Icon className='size-4 shrink-0 text-muted-foreground' name='search' />
        <Input
          aria-label='Buscar produto por nome'
          className='h-10 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
          data-focus-ring='delegated'
          id='new-sale-search'
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder='Buscar produto por nome'
          value={search}
        />
      </label>

      {isLoadingCatalog && !catalogPage ? (
        <div
          aria-label='Carregando produtos'
          className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
          role='status'
        >
          {[1, 2, 3, 4].map((item) => (
            <Card aria-hidden='true' className='rounded-2xl' key={item}>
              <CardContent className='flex min-h-44 flex-col p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <span className='size-10 animate-pulse rounded-xl bg-muted motion-reduce:animate-none' />
                  <span className='h-6 w-16 animate-pulse rounded-full bg-muted motion-reduce:animate-none' />
                </div>
                <span className='mt-4 h-5 w-3/5 animate-pulse rounded bg-muted motion-reduce:animate-none' />
                <span className='mt-2 h-5 w-full animate-pulse rounded bg-muted motion-reduce:animate-none' />
                <div className='mt-auto flex items-end justify-between gap-2 pt-4'>
                  <span className='h-5 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none' />
                  <span className='h-6 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none' />
                </div>
                <span className='mt-3 h-10 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {isCatalogError ? (
        <div
          className='mt-4 grid min-h-52 place-items-center rounded-2xl border bg-card p-6 text-center'
          role='alert'
        >
          <div>
            <Icon className='mx-auto size-7 text-danger' name='triangle-alert' />
            <p className='mt-3 font-bold'>Não foi possível carregar os produtos.</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Tente novamente em alguns instantes.
            </p>
            <Button
              className='mt-4'
              onClick={() => void refetchCatalog()}
              type='button'
              variant='outline'
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : null}

      {catalogPage && catalogPage.items.length === 0 ? (
        <div
          className='mt-4 grid min-h-52 place-items-center rounded-2xl border bg-card p-6 text-center'
          role='status'
        >
          <div>
            <Icon className='mx-auto size-7 text-muted-foreground' name='search' />
            <p className='mt-3 font-bold'>Nenhum produto encontrado.</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Ajuste a busca ou o tipo selecionado.
            </p>
            <Button
              className='mt-4'
              onClick={handleClearFilters}
              type='button'
              variant='outline'
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      ) : null}

      {catalogPage && catalogPage.items.length > 0 ? (
        <>
          <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {catalogPage.items.map((product) => {
              const isAdded = props.addedProductIds.includes(product.productId)
              const isUnavailable = !product.isAvailable
              const availableSize = product.sizes.find(
                (size) => size.isActive && size.isAvailable,
              )
              const availableBrand = product.resaleBrands.find(
                (brand) => brand.isActive && brand.isAvailable,
              )
              const startingPrice =
                product.kind === 'portion'
                  ? availableSize?.basePrice
                  : (availableBrand?.basePrice ?? product.resalePrice)

              return (
                <Card
                  className={cn(
                    'min-w-0 rounded-2xl transition-colors',
                    isAdded && 'border-primary ring-1 ring-primary',
                    isUnavailable && 'opacity-55',
                  )}
                  key={product.productId}
                >
                  <CardContent className='flex min-h-44 flex-col p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <span
                        className={cn(
                          'grid size-10 place-items-center rounded-xl',
                          product.kind === 'portion'
                            ? 'bg-accent text-primary'
                            : 'bg-info-soft text-info',
                        )}
                      >
                        <Icon className='size-5' name={CATEGORY_ICONS[product.kind]} />
                      </span>
                      <Badge
                        className={cn(
                          product.kind === 'portion'
                            ? 'bg-accent text-primary'
                            : 'bg-info-soft text-info',
                        )}
                      >
                        {product.kind === 'portion' ? 'Porção' : 'Revenda'}
                      </Badge>
                    </div>
                    <h3 className='mt-4 line-clamp-2 font-extrabold'>{product.name}</h3>
                    <p className='mt-1 min-h-5 text-sm text-muted-foreground'>
                      {product.kind === 'portion'
                        ? 'Escolha o tamanho e os acompanhamentos'
                        : product.stockControl === 'by-brand'
                          ? 'Escolha a marca e a embalagem'
                          : 'Produto com estoque único'}
                    </p>
                    <div className='mt-auto flex items-end justify-between gap-2 pt-4'>
                      <span className='text-sm font-extrabold'>
                        {startingPrice === undefined
                          ? 'Preço sob consulta'
                          : `A partir de ${formatCurrency(startingPrice)}`}
                      </span>
                      <Badge
                        className={cn(
                          'shrink-0',
                          isUnavailable
                            ? 'bg-danger-soft text-danger'
                            : isAdded
                              ? 'bg-accent text-primary'
                              : 'bg-success-soft text-success',
                        )}
                      >
                        <Icon
                          name={isUnavailable ? 'x' : isAdded ? 'check' : 'circle-check'}
                        />
                        {isUnavailable
                          ? 'Sem estoque'
                          : isAdded
                            ? 'Adicionado'
                            : 'Disponível'}
                      </Badge>
                    </div>
                    <Button
                      aria-label={`${isAdded ? 'Editar' : 'Adicionar'} ${product.name}`}
                      className='mt-3 w-full'
                      disabled={isUnavailable || isAdded}
                      onClick={() => handleSelectProduct(product)}
                      type='button'
                      variant={isAdded ? 'outline' : 'default'}
                    >
                      {isAdded ? 'No pedido' : 'Adicionar'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Pagination
            className='mt-4 rounded-xl border'
            currentPage={catalogPage.page}
            itemLabel='produtos'
            onPageChange={handlePageChange}
            pageSize={catalogPage.pageSize}
            totalItems={catalogPage.total}
          />
        </>
      ) : null}
    </section>
  )
}
