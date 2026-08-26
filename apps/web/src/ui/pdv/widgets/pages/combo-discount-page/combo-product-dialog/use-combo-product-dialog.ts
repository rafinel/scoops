import { useEffect, useState } from 'react'

import type {
  ComboComponentDetails,
  DiscountComponent,
  SaleItemKind,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

import { useComboProductsQuery } from '@/ui/pdv/hooks/use-combo-products-query'

export type ComboProductDetails = ComboComponentDetails

export type ComboProductDialogProps = {
  existingProductIds: string[]
  onAdd: (details: ComboProductDetails) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const roundCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export function useComboProductDialog({
  existingProductIds,
  onAdd,
  onOpenChange,
  open,
}: ComboProductDialogProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [kind, setKind] = useState<SaleItemKind | undefined>()
  const [selectedProduct, setSelectedProduct] = useState<SalesCatalogProduct>()
  const [sizeId, setSizeId] = useState<string>()
  const [brandId, setBrandId] = useState<string>()
  const [accompanimentIds, setAccompanimentIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [configurationError, setConfigurationError] = useState<string | null>(null)
  const { catalogError, catalogPage, isCatalogError, isLoadingCatalog } =
    useComboProductsQuery(debouncedSearch, kind, open)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timeout)
  }, [search])

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

  const products = (catalogPage?.items ?? []).filter(
    (product) => product.isActive && !existingProductIds.includes(product.productId),
  )
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
  const unitPrice =
    selectedProduct?.kind === 'portion'
      ? roundCents(
          (selectedSize?.basePrice ?? 0) +
            activeAccompaniments.reduce((total, item) => total + item.basePrice, 0),
        )
      : (selectedBrand?.basePrice ?? selectedProduct?.resalePrice ?? 0)
  const subtotal = roundCents(unitPrice * quantity)
  const isValidConfiguration = Boolean(
    selectedProduct &&
      quantity > 0 &&
      (selectedProduct.kind === 'portion'
        ? selectedSize?.isActive
        : selectedBrand
          ? selectedBrand.isActive
          : selectedProduct.resalePrice !== undefined),
  )

  function handleSelectProduct(product: SalesCatalogProduct) {
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
    isValidConfiguration,
    kind,
    products,
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
