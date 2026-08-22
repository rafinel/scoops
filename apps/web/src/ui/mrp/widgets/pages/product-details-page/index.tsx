import type { ReactNode } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  ProductDetailsTabs,
  type ProductDetailsTab,
} from '@/ui/mrp/widgets/components/product-details-tabs'

import { ProductDetailsHeader } from './product-details-header'

export type ProductDetailsPageProps = {
  children: ReactNode
  onBack: () => void
  product?: Product
  selectedTab: ProductDetailsTab
}

export const ProductDetailsPage = ({
  children,
  onBack,
  product,
  selectedTab,
}: ProductDetailsPageProps) => {
  return (
    <section className='min-w-0 max-w-full space-y-5 overflow-hidden pb-8'>
      <Button
        aria-label='Voltar para produtos'
        className='font-bold'
        onClick={onBack}
        variant='outline'
      >
        <Icon className='size-4' name='chevron-left' /> Voltar
      </Button>
      {product ? (
        <>
          <ProductDetailsHeader product={product} />
          <ProductDetailsTabs product={product} selectedTab={selectedTab} />
        </>
      ) : null}
      {children}
    </section>
  )
}
