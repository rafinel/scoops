import { useEffect, useRef, useState } from 'react'

import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

import { productStockRoute } from '@/constants/routes'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type ProductPricingAction =
  | { kind: 'add' }
  | { kind: 'edit'; size: ProductSizePricing }
  | { kind: 'remove'; size: ProductSizePricing }

export function useProductPricingSlot(productId: string) {
  const { pricing, pricingError, isLoadingPricing, retryPricing } =
    useProductPricingQuery(productId)
  const { navigateTo, navigateToPath } = useNavigation()
  const [selectedAction, setSelectedAction] = useState<ProductPricingAction>()
  const lastFocusTarget = useRef<HTMLElement | null>(null)
  const hadAction = useRef(false)
  const isUnsupported = Boolean(
    pricing &&
      !pricing.product.categories.includes('portion') &&
      !pricing.product.categories.includes('resale'),
  )

  useEffect(() => {
    if (isUnsupported) void navigateToPath(productStockRoute(productId))
  }, [isUnsupported, navigateToPath, productId])

  useEffect(() => {
    if (!selectedAction && hadAction.current) {
      lastFocusTarget.current?.focus()
      lastFocusTarget.current = null
    }
    hadAction.current = Boolean(selectedAction)
  }, [selectedAction])

  function handleBack() {
    void navigateTo('products')
  }

  function handleRetry() {
    void retryPricing()
  }

  function rememberFocusTarget(target: HTMLElement) {
    lastFocusTarget.current = target
  }

  function handleAdd(target: HTMLElement) {
    rememberFocusTarget(target)
    setSelectedAction({ kind: 'add' })
  }

  function handleEdit(size: ProductSizePricing, target: HTMLElement) {
    rememberFocusTarget(target)
    setSelectedAction({ kind: 'edit', size })
  }

  function handleRemove(size: ProductSizePricing, target: HTMLElement) {
    rememberFocusTarget(target)
    setSelectedAction({ kind: 'remove', size })
  }

  function handleActionOpenChange(isOpen: boolean) {
    if (!isOpen) setSelectedAction(undefined)
  }

  async function handleActionSuccess() {
    setSelectedAction(undefined)
    await retryPricing()
  }

  return {
    pricingError,
    isLoadingPricing,
    pricing,
    selectedAction,
    handleActionOpenChange,
    handleActionSuccess,
    handleAdd,
    handleBack,
    handleEdit,
    handleRemove,
    handleRetry,
  }
}
