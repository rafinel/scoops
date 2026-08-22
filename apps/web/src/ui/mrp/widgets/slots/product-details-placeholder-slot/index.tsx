import { Button } from '@/ui/shadcn/button'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import type { ProductDetailsTab } from '@/ui/mrp/widgets/components/product-details-tabs'

import { useProductDetailsPlaceholderSlot } from './use-product-details-placeholder-slot'

export type ProductDetailsPlaceholderSlotProps = {
  allowedCategories?: readonly ProductCategory[]
  description: string
  icon: IconName
  productId: string
  selectedTab: ProductDetailsTab
  title: string
}

export const ProductDetailsPlaceholderSlot = ({
  allowedCategories,
  description,
  icon,
  productId,
  selectedTab,
  title,
}: ProductDetailsPlaceholderSlotProps) => {
  const {
    hasProductError,
    isLoadingProduct,
    isUnsupported,
    product,
    handleBack,
    handleRetry,
  } = useProductDetailsPlaceholderSlot(productId, allowedCategories)

  return (
    <ProductDetailsPage onBack={handleBack} product={product} selectedTab={selectedTab}>
      {isLoadingProduct && !isUnsupported ? (
        <div
          aria-busy='true'
          aria-label='Carregando produto'
          className='space-y-4'
          role='status'
        >
          <div className='h-44 animate-pulse rounded-2xl bg-muted' />
          <div className='h-52 animate-pulse rounded-2xl bg-muted' />
        </div>
      ) : null}
      {hasProductError && !isUnsupported ? (
        <div
          className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
          role='alert'
        >
          <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
          <h1 className='mt-3 text-lg font-extrabold'>
            Não foi possível carregar o produto
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Verifique sua conexão e tente novamente.
          </p>
          <Button className='mt-4' onClick={handleRetry} variant='outline'>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {product && !isLoadingProduct && !hasProductError && !isUnsupported ? (
        <section className='rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/5'>
          <div className='flex items-start gap-4'>
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
              <Icon className='size-5' name={icon} />
            </span>
            <div>
              <h2 className='text-lg font-extrabold'>{title}</h2>
              <p className='mt-1 max-w-xl text-sm text-muted-foreground'>{description}</p>
              <p className='mt-4 text-sm font-semibold text-primary'>Em breve</p>
            </div>
          </div>
        </section>
      ) : null}
    </ProductDetailsPage>
  )
}
