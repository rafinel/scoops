import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { productPricingSearchSchema } from '@scoops/validation'

import { ProductPricingSlot } from '@/ui/mrp/widgets/slots/product-pricing-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/prices')({
  validateSearch: productPricingSearchSchema,
  component: ProductPricesRoute,
})

function ProductPricesRoute() {
  const { productId } = Route.useParams()
  const { focus } = Route.useSearch()

  useEffect(() => {
    if (!focus) return

    const headingText = focus === 'sizes' ? 'Tamanhos e preços' : 'Preço de Revenda'

    function focusPricingSection() {
      const focusTarget = Array.from(document.querySelectorAll<HTMLElement>('h2')).find(
        (heading) => heading.textContent?.trim() === headingText,
      )
      if (!focusTarget) return false

      const section = focusTarget.closest('section')
      if (!(section instanceof HTMLElement)) return false

      section.tabIndex = -1
      section.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      })
      section.focus({ preventScroll: true })
      return true
    }

    if (focusPricingSection()) return

    const observer = new MutationObserver(() => {
      if (focusPricingSection()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [focus])

  return <ProductPricingSlot productId={productId} />
}
