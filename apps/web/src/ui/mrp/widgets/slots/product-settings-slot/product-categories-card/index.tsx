import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { CATEGORY_ICONS } from '@/constants'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CategoryDependencyDialog } from '../category-dependency-dialog'
import type { ProductSettingsSearch } from '../use-product-settings-slot'
import { useProductCategoriesCard } from './use-product-categories-card'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  ingredient: 'border-blue-300 bg-blue-50 text-blue-700',
  manufacturable: 'border-violet-300 bg-violet-50 text-violet-700',
  portion: 'border-green-300 bg-green-50 text-green-700',
  accompaniment: 'border-amber-300 bg-amber-50 text-amber-700',
  resale: 'border-red-300 bg-red-50 text-red-700',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

export type ProductCategoriesCardProps = {
  product: Product
  retrySearch: ProductSettingsSearch
}

export const ProductCategoriesCard = ({
  product,
  retrySearch,
}: ProductCategoriesCardProps) => {
  const {
    categoryRemovalImpact,
    categoryRemovalImpactError,
    error,
    handleCategoryClick,
    handleConfirmRemoval,
    handleDialogOpenChange,
    handleRetry,
    isChangingCategories,
    isLoadingImpact,
    isPendingImpact,
    retryImpact,
    selectedCategory,
  } = useProductCategoriesCard(product, retrySearch)
  const selectedImpact = categoryRemovalImpact
  const dialogOpen = Boolean(selectedCategory)

  return (
    <section
      aria-labelledby='product-categories-title'
      className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
    >
      <div className='flex items-start gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning'>
          <Icon name='tags' />
        </span>
        <div>
          <h2 className='text-lg font-extrabold' id='product-categories-title'>
            Categorias do produto
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Escolha onde este produto pode ser usado.
          </p>
        </div>
      </div>
      <div className='mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3'>
        {CATEGORIES.map((category) => {
          const active = product.categories.includes(category)
          const disabled =
            isChangingCategories ||
            (category === 'manufacturable' && product.stockControl === 'by-brand') ||
            (!active &&
              ((category === 'portion' && product.categories.includes('resale')) ||
                (category === 'resale' && product.categories.includes('portion'))))
          return (
            <button
              aria-pressed={active}
              className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${active ? CATEGORY_STYLES[category] : 'border-border bg-background hover:bg-muted'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={disabled}
              key={category}
              onClick={() => handleCategoryClick(category)}
              type='button'
            >
              <Icon className='size-4 shrink-0' name={CATEGORY_ICONS[category]} />
              <span>{CATEGORY_LABELS[category]}</span>
            </button>
          )
        })}
      </div>
      <p className='mt-3 text-xs text-muted-foreground'>
        Remover uma categoria pode exigir a revisão de cadastros relacionados.
      </p>
      {product.stockControl === 'by-brand' ? (
        <p className='mt-2 text-xs font-semibold text-muted-foreground'>
          Produtos controlados por marca não podem ser fabricáveis; use estoque único para
          adicionar esta categoria.
        </p>
      ) : null}
      {product.categories.includes('portion') || product.categories.includes('resale') ? (
        <p className='mt-2 text-xs font-semibold text-muted-foreground'>
          Porção e Revenda são mutuamente exclusivas neste produto.
        </p>
      ) : null}
      {error ? (
        <div
          className='mt-4 grid gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger'
          role='alert'
        >
          <div className='flex items-start gap-2'>
            <Icon className='mt-0.5 size-4 shrink-0' name='triangle-alert' />
            <span>{error}</span>
          </div>
          <button
            className='w-fit text-xs font-bold underline-offset-2 hover:underline'
            onClick={handleRetry}
            type='button'
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
      {isChangingCategories ? (
        <p className='mt-3 text-xs font-semibold text-muted-foreground' role='status'>
          Atualizando categorias…
        </p>
      ) : null}

      {selectedCategory ? (
        <CategoryDependencyDialog
          canRemove={selectedImpact?.canRemove ?? false}
          category={selectedCategory}
          dependencies={selectedImpact?.dependencies ?? []}
          error={
            categoryRemovalImpactError
              ? 'Não foi possível carregar os vínculos.'
              : undefined
          }
          isLoading={isLoadingImpact || isPendingImpact}
          isPending={isChangingCategories}
          onConfirm={() => void handleConfirmRemoval()}
          onOpenChange={handleDialogOpenChange}
          onRetry={() => void retryImpact()}
          open={dialogOpen}
          productId={product.id}
          productName={product.name}
        />
      ) : null}
    </section>
  )
}
