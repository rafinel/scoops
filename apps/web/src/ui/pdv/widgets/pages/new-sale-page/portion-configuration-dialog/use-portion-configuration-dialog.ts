import { useEffect, useMemo, useState } from 'react'

import type {
  CartLineInput,
  SalesCatalogProduct,
  SalesCatalogSize,
} from '@scoops/core/pdv/domain/structures'
import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

export type PortionConfigurationDialogProps = {
  initialLine?: CartLineInput
  isOpen: boolean
  product?: SalesCatalogProduct
  salesChannel?: SalesChannel
  onOpenChange: (open: boolean) => void
  onSave: (line: CartLineInput) => void
}

export function usePortionConfigurationDialog({
  initialLine,
  isOpen,
  product,
  salesChannel,
  onOpenChange,
  onSave,
}: PortionConfigurationDialogProps) {
  const firstAvailableSize = product?.sizes.find(
    (size) => size.isActive && size.isAvailable,
  )
  const [sizeId, setSizeId] = useState(
    initialLine?.sizeId ?? firstAvailableSize?.sizeId ?? '',
  )
  const [accompanimentIds, setAccompanimentIds] = useState<readonly string[]>(
    initialLine?.accompanimentIds ?? [],
  )
  const [quantity, setQuantity] = useState(initialLine?.quantity ?? 1)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedSize = product?.sizes.find((size) => size.sizeId === sizeId)
  const selectedAccompaniments = useMemo(
    () =>
      selectedSize?.accompaniments.filter((accompaniment) =>
        accompanimentIds.includes(accompaniment.accompanimentId),
      ) ?? [],
    [accompanimentIds, selectedSize],
  )
  const estimatedBasePrice =
    (selectedSize?.basePrice ?? 0) +
    selectedAccompaniments.reduce(
      (total, accompaniment) => total + accompaniment.basePrice,
      0,
    )
  const estimatedUnitPrice =
    Math.round(estimatedBasePrice * (1 + (salesChannel?.percentage ?? 0) / 100) * 100) /
    100

  useEffect(() => {
    if (!isOpen || !product) return
    const nextSizeId =
      initialLine?.sizeId ??
      product.sizes.find((size) => size.isActive && size.isAvailable)?.sizeId
    setSizeId(nextSizeId ?? '')
    setAccompanimentIds(initialLine?.accompanimentIds ?? [])
    setQuantity(initialLine?.quantity ?? 1)
    setFormError(null)
  }, [initialLine, isOpen, product])

  function handleSizeChange(nextSize: SalesCatalogSize) {
    if (!nextSize.isActive || !nextSize.isAvailable) return
    setSizeId(nextSize.sizeId)
    setAccompanimentIds((currentIds) =>
      currentIds.filter((id) =>
        nextSize.accompaniments.some((item) => item.accompanimentId === id),
      ),
    )
    setFormError(null)
  }

  function handleAccompanimentChange(accompanimentId: string, checked: boolean) {
    setAccompanimentIds((currentIds) => {
      if (checked)
        return currentIds.includes(accompanimentId)
          ? currentIds
          : [...currentIds, accompanimentId]
      return currentIds.filter((id) => id !== accompanimentId)
    })
    setFormError(null)
  }

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(Math.min(999, Math.max(1, nextQuantity)))
    setFormError(null)
  }

  function handleSubmit() {
    if (!product || !sizeId || !selectedSize?.isActive || !selectedSize.isAvailable) {
      setFormError('Escolha um tamanho disponível para continuar.')
      return
    }
    if (
      accompanimentIds.some(
        (id) =>
          !selectedSize.accompaniments.some(
            (accompaniment) =>
              accompaniment.accompanimentId === id &&
              accompaniment.isActive &&
              accompaniment.isAvailable,
          ),
      )
    ) {
      setFormError('Remova os acompanhamentos indisponíveis antes de continuar.')
      return
    }

    onSave({
      accompanimentIds,
      kind: 'portion',
      productId: product.productId,
      quantity,
      sizeId,
    })
    onOpenChange(false)
  }

  function handleClose() {
    onOpenChange(false)
  }

  return {
    accompanimentIds,
    estimatedUnitPrice,
    formError,
    handleAccompanimentChange,
    handleClose,
    handleQuantityChange,
    handleSizeChange,
    handleSubmit,
    quantity,
    selectedSize,
    sizeId,
  }
}
