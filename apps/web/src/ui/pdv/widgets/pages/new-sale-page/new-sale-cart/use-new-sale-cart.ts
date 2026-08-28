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
  selectedChannelId?: string
  onChannelChange: (channelId: string | undefined) => void
  onClear: () => void
  onEditLine: (line: CartLineInput, product: SalesCatalogProduct | undefined) => void
  onQuantityChange: (productId: string, quantity: number) => void
  onRegister: () => void
  onRemoveLine: (productId: string) => void
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

  function handleEditLine(line: CartLineInput) {
    onEditLine(line, productsById.get(line.productId))
  }

  function handleRemoveLine(productId: string) {
    onRemoveLine(productId)
  }

  function handleQuantityChange(productId: string, quantity: number) {
    onQuantityChange(productId, quantity)
  }

  function handleRegister() {
    if (props.canRegister) onRegister()
  }

  return {
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
