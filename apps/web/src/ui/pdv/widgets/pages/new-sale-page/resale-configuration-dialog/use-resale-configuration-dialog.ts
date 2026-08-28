import { useEffect, useState } from 'react'

import type {
  CartLineInput,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'
import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

export type ResaleConfigurationDialogProps = {
  initialLine?: CartLineInput
  isOpen: boolean
  product?: SalesCatalogProduct
  salesChannel?: SalesChannel
  onOpenChange: (open: boolean) => void
  onSave: (line: CartLineInput) => void
}

export function useResaleConfigurationDialog({
  initialLine,
  isOpen,
  product,
  salesChannel,
  onOpenChange,
  onSave,
}: ResaleConfigurationDialogProps) {
  const firstAvailableBrand =
    product?.stockControl === 'by-brand'
      ? product.resaleBrands.find((brand) => brand.isActive && brand.isAvailable)
      : undefined
  const [brandId, setBrandId] = useState(
    product?.stockControl === 'by-brand'
      ? (initialLine?.brandId ?? firstAvailableBrand?.brandId)
      : undefined,
  )
  const [quantity, setQuantity] = useState(initialLine?.quantity ?? 1)
  const [formError, setFormError] = useState<string | null>(null)
  const selectedBrand = product?.resaleBrands.find((brand) => brand.brandId === brandId)
  const basePrice = selectedBrand?.basePrice ?? product?.resalePrice ?? 0
  const estimatedUnitPrice =
    Math.round(basePrice * (1 + (salesChannel?.percentage ?? 0) / 100) * 100) / 100

  useEffect(() => {
    if (!isOpen || !product) return
    setBrandId(
      product.stockControl === 'by-brand'
        ? (initialLine?.brandId ??
            product.resaleBrands.find((brand) => brand.isActive && brand.isAvailable)
              ?.brandId)
        : undefined,
    )
    setQuantity(initialLine?.quantity ?? 1)
    setFormError(null)
  }, [initialLine, isOpen, product])

  function handleBrandChange(nextBrandId: string) {
    const brand = product?.resaleBrands.find(
      (candidate) => candidate.brandId === nextBrandId,
    )
    if (product?.stockControl !== 'by-brand' || !brand?.isActive || !brand.isAvailable)
      return
    setBrandId(nextBrandId)
    setFormError(null)
  }

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(Math.min(999, Math.max(1, nextQuantity)))
    setFormError(null)
  }

  function handleSubmit() {
    if (!product) return
    if (product.stockControl === 'by-brand' && !brandId) {
      setFormError('Escolha uma marca disponível para continuar.')
      return
    }
    if (
      brandId &&
      !product.resaleBrands.some(
        (brand) => brand.brandId === brandId && brand.isActive && brand.isAvailable,
      )
    ) {
      setFormError('Escolha uma marca disponível para continuar.')
      return
    }

    onSave({
      accompanimentIds: [],
      ...(product.stockControl === 'by-brand' && brandId ? { brandId } : {}),
      kind: 'resale',
      productId: product.productId,
      quantity,
    })
    onOpenChange(false)
  }

  function handleClose() {
    onOpenChange(false)
  }

  return {
    brandId,
    estimatedUnitPrice,
    formError,
    handleBrandChange,
    handleClose,
    handleQuantityChange,
    handleSubmit,
    quantity,
    selectedBrand,
  }
}
