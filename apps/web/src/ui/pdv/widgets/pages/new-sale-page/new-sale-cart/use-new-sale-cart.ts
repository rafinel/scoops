import { useMemo, useState } from 'react'

import type {
  Cart,
  CartLineInput,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'
import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

export type NewSaleCartProps = {
  canRegister: boolean
  channels: readonly SalesChannel[]
  isPreviewPending: boolean
  lineInputs: readonly CartLineInput[]
  products: readonly SalesCatalogProduct[]
  previewCart?: Cart
  previewError?: string
  selectedChannelId?: string
  onChannelChange: (channelId: string | undefined) => void
  onClear: () => void
  onEditLine: (
    line: CartLineInput,
    product: SalesCatalogProduct | undefined,
    lineIndex: number,
  ) => void
  onQuantityChange: (lineIndex: number, quantity: number) => void
  onRegister: () => void
  onRemoveLine: (lineIndex: number) => void
}

export function useNewSaleCart({
  lineInputs,
  onClear,
  onEditLine,
  onQuantityChange,
  onRegister,
  onRemoveLine,
  previewCart,
  ...props
}: NewSaleCartProps) {
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] = useState(false)
  const baseSubtotalCents = (previewCart?.lines ?? []).reduce(
    (total, line) => total + Math.round(line.baseUnitPrice * 100) * line.quantity,
    0,
  )
  const baseSubtotal = baseSubtotalCents / 100
  const channelAdjustment = previewCart
    ? (Math.round(previewCart.subtotal * 100) - baseSubtotalCents) / 100
    : 0
  const productsById = useMemo(
    () => new Map(props.products.map((product) => [product.productId, product])),
    [props.products],
  )

  function handleOpenClearConfirmation() {
    if (lineInputs.length > 0) setIsClearConfirmationOpen(true)
  }

  function handleClearConfirmationChange(open: boolean) {
    setIsClearConfirmationOpen(open)
  }

  function handleConfirmClear() {
    onClear()
    setIsClearConfirmationOpen(false)
  }

  function handleEditLine(line: CartLineInput, lineIndex: number) {
    onEditLine(line, productsById.get(line.productId), lineIndex)
  }

  function handleRemoveLine(lineIndex: number) {
    onRemoveLine(lineIndex)
  }

  function handleQuantityChange(lineIndex: number, quantity: number) {
    onQuantityChange(lineIndex, quantity)
  }

  function handleRegister() {
    if (props.canRegister) onRegister()
  }

  return {
    baseSubtotal,
    channelAdjustment,
    handleClearConfirmationChange,
    handleConfirmClear,
    handleEditLine,
    handleOpenClearConfirmation,
    handleQuantityChange,
    handleRegister,
    handleRemoveLine,
    isClearConfirmationOpen,
    lineInputs,
    previewCart,
    productsById,
  }
}
