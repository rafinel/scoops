import { useState } from 'react'

import type {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import { ProductCategory as ProductCategories } from '@scoops/core/mrp/domain/structures'

import { useRegisterProductAction } from '../../../../hooks/use-register-product-action'

export type BrandDraft = {
  id: string
  name: string
  packageQuantity: string
  packagePrice: string
  packageCount: string
  isPrimary: boolean
}

const createBrandDraft = (id: string): BrandDraft => ({
  id,
  name: '',
  packageQuantity: '1',
  packagePrice: '0,00',
  packageCount: '0',
  isPrimary: id === 'brand-1',
})

export function useProductRegistrationDialog({ onSuccess }: { onSuccess: () => void }) {
  const registration = useRegisterProductAction()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<ProductUnit>('un')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [stockControl, setStockControl] = useState<ProductStockControl>('single')
  const [allowNegativeStock, setAllowNegativeStock] = useState(false)
  const [brands, setBrands] = useState<BrandDraft[]>([])
  const [initialStock, setInitialStock] = useState('0')
  const [idealStock, setIdealStock] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    categories?: string
    idealStock?: string
    name?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const calculatedInitialStock =
    stockControl === 'by-brand'
      ? brands.reduce(
          (total, brand) =>
            total +
            (Number(brand.packageQuantity) || 0) * (Number(brand.packageCount) || 0),
          0,
        )
      : Number(initialStock) || 0

  function handleNameChange(value: string) {
    setName(value)
    setFieldErrors((current) => ({ ...current, name: undefined }))
  }

  function handleIdealStockChange(value: string) {
    setIdealStock(value)
    setFieldErrors((current) => ({ ...current, idealStock: undefined }))
  }

  function handleProductCategoryToggle(category: ProductCategory) {
    setCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category)
      }

      const nextCategories = [...current, category]
      if (category === ProductCategories.Portion) {
        return nextCategories.filter((item) => item !== ProductCategories.Resale)
      }
      if (category === ProductCategories.Resale) {
        return nextCategories.filter((item) => item !== ProductCategories.Portion)
      }
      return nextCategories
    })
    if (category === ProductCategories.Manufacturable) {
      setStockControl('single')
    }
    setFieldErrors((current) => ({ ...current, categories: undefined }))
  }

  function handleStockControlChange(value: ProductStockControl) {
    if (value === 'by-brand' && categories.includes(ProductCategories.Manufacturable)) {
      return
    }
    setStockControl(value)
    if (value === 'by-brand' && brands.length === 0) {
      setBrands([createBrandDraft('brand-1')])
    }
  }

  function handleBrandChange(brandId: string, changes: Partial<BrandDraft>) {
    setBrands((current) =>
      current.map((brand) => (brand.id === brandId ? { ...brand, ...changes } : brand)),
    )
  }

  function handleRemoveBrand(brandId: string) {
    setBrands((current) =>
      current.length === 1 ? current : current.filter((brand) => brand.id !== brandId),
    )
  }

  function handleAddBrand() {
    setBrands((current) => [...current, createBrandDraft(`brand-${current.length + 1}`)])
  }

  function isCategoryDisabled(category: ProductCategory) {
    return (
      (category === ProductCategories.Portion &&
        categories.includes(ProductCategories.Resale)) ||
      (category === ProductCategories.Resale &&
        categories.includes(ProductCategories.Portion))
    )
  }

  function resetForm() {
    setName('')
    setUnit('un')
    setCategories([])
    setStockControl('single')
    setAllowNegativeStock(false)
    setBrands([])
    setInitialStock('0')
    setIdealStock('')
    setFieldErrors({})
    setFormError(null)
  }

  async function handleRegister() {
    const nextFieldErrors = {
      name: name.trim() ? undefined : 'Informe o nome do produto.',
      categories:
        categories.length > 0 ? undefined : 'Selecione pelo menos uma categoria.',
      idealStock:
        idealStock.trim() !== '' && Number(idealStock) >= 0
          ? undefined
          : 'Informe um estoque ideal válido.',
    }
    if (
      nextFieldErrors.name ||
      nextFieldErrors.categories ||
      nextFieldErrors.idealStock
    ) {
      setFieldErrors(nextFieldErrors)
      setFormError(null)
      return
    }

    setFieldErrors({})
    setFormError(null)
    const effectiveStockControl = categories.includes(ProductCategories.Manufacturable)
      ? 'single'
      : stockControl

    try {
      await registration.mutateAsync({
        name,
        unit,
        categories,
        stockControl: effectiveStockControl,
        allowNegativeStock,
        idealStock: Number(idealStock),
        initialStock: calculatedInitialStock,
        brands:
          effectiveStockControl === 'by-brand'
            ? brands.map((brand) => ({
                name: brand.name,
                packageQuantity: Number(brand.packageQuantity) || 0,
                packageValue: Number(brand.packagePrice.replace(',', '.')) || 0,
                initialQuantity:
                  (Number(brand.packageQuantity) || 0) *
                  (Number(brand.packageCount) || 0),
                isPrimary: brand.isPrimary,
              }))
            : undefined,
      })
      resetForm()
      onSuccess()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível criar o produto.',
      )
    }
  }

  return {
    brands,
    calculatedInitialStock,
    categories,
    allowNegativeStock,
    fieldErrors,
    formError,
    handleAddBrand,
    handleBrandChange,
    handleNameChange,
    handleIdealStockChange,
    handleProductCategoryToggle,
    handleRegister,
    handleRemoveBrand,
    handleStockControlChange,
    isCategoryDisabled,
    idealStock,
    initialStock,
    isPending: registration.isPending,
    name,
    setAllowNegativeStock,
    setInitialStock,
    setUnit,
    stockControl,
    unit,
  }
}
