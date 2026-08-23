import type { MouseEvent, ReactNode } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'

import {
  ProductDetailsTabs,
  type ProductDetailsTab,
} from '@/ui/mrp/widgets/components/product-details-tabs'
import { BackLink } from '@/ui/shared/widgets/components/back-link'

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
  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    onBack()
  }

  return (
    <section className='min-w-0 max-w-full space-y-5 overflow-hidden pb-8'>
      <BackLink aria-label='Voltar para produtos' onClick={handleBack} />
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
