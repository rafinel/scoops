import { useEffect, useState } from 'react'

import {
  SalesCatalogAvailability,
  type ComboComponentDetails,
  type DiscountComponent,
  type SaleItemKind,
  type SalesCatalogAccompaniment,
  type SalesCatalogBrand,
  type SalesCatalogListItem,
  type SalesCatalogProduct,
  type SalesCatalogSize,
} from '@scoops/core/pdv/domain/structures'

import { useComboProductsQuery } from '@/ui/pdv/hooks/use-combo-products-query'
import { useEffectiveSearch } from '@/ui/pdv/hooks/use-effective-search'
import { getEffectiveAvailability } from '@/ui/pdv/utils/get-effective-availability'
import type { UnavailableSalesCatalogAvailability } from '@/ui/pdv/widgets/components/sales-catalog-availability-pill'

export type ComboProductDetails = ComboComponentDetails

export type ComboProductDialogProps = {
  existingProductIds: string[]
  onAdd: (details: ComboProductDetails) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export type ComboProductRow = {
  product: SalesCatalogListItem
  unavailableReason?: UnavailableSalesCatalogAvailability
  availabilityPillId: string
}

function createProductRow(product: SalesCatalogListItem): ComboProductRow {
  const availability = getEffectiveAvailability(product)

  return {
    product,
    unavailableReason:
      availability === SalesCatalogAvailability.Available ? undefined : availability,
    availabilityPillId: `combo-product-availability-${product.productId}`,
  }
}

const roundCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

function calculateUnitPrice(
  product: SalesCatalogProduct | undefined,
  size: SalesCatalogSize | undefined,
  brand: SalesCatalogBrand | undefined,
  accompaniments: readonly SalesCatalogAccompaniment[],
) {
  if (product?.kind !== 'portion') return brand?.basePrice ?? product?.resalePrice ?? 0

  return roundCents(
    (size?.basePrice ?? 0) +
      accompaniments.reduce((total, item) => total + item.basePrice, 0),
  )
}

function isConfigurationValid(
  product: SalesCatalogProduct | undefined,
  size: SalesCatalogSize | undefined,
  brand: SalesCatalogBrand | undefined,
) {
  if (!product) return false
  if (product.kind === 'portion') return Boolean(size?.isActive)
  if (brand) return brand.isActive

  return product.resalePrice !== undefined
}

export function useComboProductDialog({
  existingProductIds,
  onAdd,
  onOpenChange,
  open,
}: ComboProductDialogProps) {
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<SaleItemKind | undefined>()
  const [selectedProduct, setSelectedProduct] = useState<SalesCatalogProduct>()
  const [sizeId, setSizeId] = useState<string>()
  const [brandId, setBrandId] = useState<string>()
  const [accompanimentIds, setAccompanimentIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [configurationError, setConfigurationError] = useState<string | null>(null)
  const effectiveSearch = useEffectiveSearch(search)
  const {
    catalogError,
    catalogPage,
    isCatalogError,
    isLoadingCatalog,
    isRefreshingCatalog,
  } = useComboProductsQuery(effectiveSearch, kind, open)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setKind(undefined)
    setSelectedProduct(undefined)
    setSizeId(undefined)
    setBrandId(undefined)
    setAccompanimentIds([])
    setQuantity(1)
    setConfigurationError(null)
  }, [open])

  const productRows = (catalogPage?.items ?? [])
    .filter(
      (product) => product.isActive && !existingProductIds.includes(product.productId),
    )
    .map(createProductRow)
  const selectedSize = selectedProduct?.sizes.find((size) => size.sizeId === sizeId)
  const selectedBrand = selectedProduct?.resaleBrands.find(
    (brand) => brand.brandId === brandId,
  )
  const activeAccompaniments =
    selectedSize?.accompaniments.filter(
      (accompaniment) =>
        accompaniment.isActive &&
        accompanimentIds.includes(accompaniment.accompanimentId),
    ) ?? []
  const unitPrice = calculateUnitPrice(
    selectedProduct,
    selectedSize,
    selectedBrand,
    activeAccompaniments,
  )
  const subtotal = roundCents(unitPrice * quantity)
  const isValidConfiguration =
    quantity > 0 && isConfigurationValid(selectedProduct, selectedSize, selectedBrand)

  function handleSelectProduct(product: SalesCatalogListItem) {
    if (getEffectiveAvailability(product) !== SalesCatalogAvailability.Available) return
    setSelectedProduct(product)
    setSizeId(
      product.kind === 'portion'
        ? product.sizes.find((size) => size.isActive)?.sizeId
        : undefined,
    )
    setBrandId(undefined)
    setAccompanimentIds([])
    setQuantity(1)
    setConfigurationError(null)
  }

  function handleFilterChange(nextKind: SaleItemKind | undefined) {
    setKind(nextKind)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleSelectBrand(nextBrandId: string) {
    setBrandId(nextBrandId)
  }

  function handleSelectSize(nextSizeId: string) {
    setSizeId(nextSizeId)
  }

  function toggleAccompaniment(accompanimentId: string) {
    setAccompanimentIds((currentIds) =>
      currentIds.includes(accompanimentId)
        ? currentIds.filter((id) => id !== accompanimentId)
        : [...currentIds, accompanimentId],
    )
  }

  function handleDecreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))
  }

  function handleIncreaseQuantity() {
    setQuantity((currentQuantity) => currentQuantity + 1)
  }

  function handleAdd() {
    if (!selectedProduct || !isValidConfiguration) {
      setConfigurationError('Selecione uma configuração válida para adicionar o produto.')
      return
    }

    const component: DiscountComponent =
      selectedProduct.kind === 'portion'
        ? {
            accompanimentIds,
            kind: 'portion',
            productId: selectedProduct.productId,
            quantity,
            sizeId: sizeId as string,
          }
        : {
            ...(brandId ? { brandId } : {}),
            kind: 'resale',
            productId: selectedProduct.productId,
            quantity,
          }
    const configurationName =
      selectedProduct.kind === 'portion'
        ? (selectedSize?.name ?? 'Porção')
        : (selectedBrand?.name ?? 'Preço padrão')
    onAdd({
      accompanimentNames: activeAccompaniments.map((item) => item.name),
      component,
      configurationName,
      productName: selectedProduct.name,
      subtotal,
      unitPrice,
      validity: 'valid',
    })
  }

  return {
    accompanimentIds,
    catalogError,
    configurationError,
    isCatalogError,
    isLoadingCatalog,
    isRefreshingCatalog,
    isValidConfiguration,
    kind,
    productRows,
    quantity,
    search,
    selectedBrand,
    selectedProduct,
    selectedSize,
    handleFilterChange,
    handleSearchChange,
    handleSelectBrand,
    handleSelectSize,
    subtotal,
    toggleAccompaniment,
    handleAdd,
    handleDecreaseQuantity,
    handleOpenChange: onOpenChange,
    handleIncreaseQuantity,
    handleSelectProduct,
  }
}
