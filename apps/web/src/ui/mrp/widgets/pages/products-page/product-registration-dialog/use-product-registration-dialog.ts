import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { productRegistrationFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import {
  ProductCategory,
  type ProductStockControl,
  type ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'

export type BrandDraft = {
  id: string
  name: string
  unit?: ProductUnit
  packageQuantity: string
  packagePrice: string
  packageCount: string
  isPrimary: boolean
}

type ProductRegistrationFormValues = z.infer<typeof productRegistrationFormSchema>

const PRODUCT_REGISTRATION_DEFAULT_VALUES: ProductRegistrationFormValues = {
  name: '',
  unit: 'un',
  categories: [],
  stockControl: 'single',
  allowNegativeStock: false,
  currentUnitCost: '',
  initialStock: '0',
  idealStock: '',
  brands: [],
}

function createBrandDraft(id: string, unit: ProductUnit): BrandDraft {
  return {
    id,
    name: '',
    unit,
    packageQuantity: '1',
    packagePrice: '0,00',
    packageCount: '0',
    isPrimary: id === 'brand-1',
  }
}

export function useProductRegistrationDialog({ onSuccess }: { onSuccess: () => void }) {
  const { isPending, mutateAsync } = useRegisterProductAction()
  const [name, setName] = useState('')
  const [unit, setUnitState] = useState<ProductUnit>('un')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [stockControl, setStockControlState] = useState<ProductStockControl>('single')
  const [allowNegativeStock, setAllowNegativeStockState] = useState(false)
  const [brands, setBrands] = useState<BrandDraft[]>([])
  const [initialStock, setInitialStockState] = useState('0')
  const [currentUnitCost, setCurrentUnitCostState] = useState('')
  const [idealStock, setIdealStockState] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    reset,
    setValue,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<ProductRegistrationFormValues>({
    defaultValues: PRODUCT_REGISTRATION_DEFAULT_VALUES,
    resolver: zodResolver(productRegistrationFormSchema),
  })
  const calculatedInitialStock =
    stockControl === 'by-brand'
      ? brands.reduce(
          (total, brand) =>
            total +
            (Number(brand.packageQuantity) || 0) * (Number(brand.packageCount) || 0),
          0,
        )
      : Number(initialStock) || 0

  function setFormValue(
    name: keyof ProductRegistrationFormValues,
    value: ProductRegistrationFormValues[keyof ProductRegistrationFormValues],
  ) {
    setValue(name as never, value as never, { shouldDirty: true, shouldValidate: true })
    setFormError(null)
  }

  function handleNameChange(value: string) {
    setName(value)
    setFormValue('name', value)
  }

  function handleIdealStockChange(value: string) {
    setIdealStockState(value)
    setFormValue('idealStock', value)
  }

  function handleInitialStockChange(value: string) {
    setInitialStockState(value)
    setFormValue('initialStock', value)
  }

  function handleCurrentUnitCostChange(value: string) {
    setCurrentUnitCostState(value)
    setFormValue('currentUnitCost', value)
  }

  function handleUnitChange(value: ProductUnit) {
    setUnitState(value)
    setFormValue('unit', value)
  }

  function handleAllowNegativeStockChange(value: boolean) {
    setAllowNegativeStockState(value)
    setFormValue('allowNegativeStock', value)
  }

  function handleProductCategoryToggle(category: ProductCategory) {
    setCategories((current) => {
      let nextCategories = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]

      if (category === ProductCategory.Portion) {
        nextCategories = nextCategories.filter((item) => item !== ProductCategory.Resale)
      }
      if (category === ProductCategory.Resale) {
        nextCategories = nextCategories.filter((item) => item !== ProductCategory.Portion)
      }
      setFormValue('categories', nextCategories)
      return nextCategories
    })
    if (category === ProductCategory.Manufacturable) handleStockControlChange('single')
  }

  function handleStockControlChange(value: ProductStockControl) {
    if (value === 'by-brand' && categories.includes(ProductCategory.Manufacturable))
      return

    setStockControlState(value)
    setFormValue('stockControl', value)
    if (value === 'by-brand' && brands.length === 0) {
      const firstBrand = createBrandDraft('brand-1', unit)
      setBrands([firstBrand])
      setFormValue('brands', [firstBrand])
    }
  }

  function handleBrandChange(brandId: string, changes: Partial<BrandDraft>) {
    setBrands((current) => {
      const nextBrands = current.map((brand) =>
        brand.id === brandId ? { ...brand, ...changes } : brand,
      )
      setFormValue('brands', nextBrands)
      return nextBrands
    })
  }

  function handleRemoveBrand(brandId: string) {
    setBrands((current) => {
      const nextBrands =
        current.length === 1 ? current : current.filter((brand) => brand.id !== brandId)
      setFormValue('brands', nextBrands)
      return nextBrands
    })
  }

  function handleAddBrand() {
    setBrands((current) => {
      const nextBrands = [
        ...current,
        createBrandDraft(`brand-${current.length + 1}`, unit),
      ]
      setFormValue('brands', nextBrands)
      return nextBrands
    })
  }

  function isCategoryDisabled(category: ProductCategory) {
    return (
      (category === ProductCategory.Portion &&
        categories.includes(ProductCategory.Resale)) ||
      (category === ProductCategory.Resale &&
        categories.includes(ProductCategory.Portion))
    )
  }

  function resetForm() {
    setName('')
    setUnitState('un')
    setCategories([])
    setStockControlState('single')
    setAllowNegativeStockState(false)
    setBrands([])
    setInitialStockState('0')
    setCurrentUnitCostState('')
    setIdealStockState('')
    setFormError(null)
    reset(PRODUCT_REGISTRATION_DEFAULT_VALUES)
  }

  async function handleRegister(values: ProductRegistrationFormValues) {
    setFormError(null)
    const effectiveStockControl = values.categories.includes(
      ProductCategory.Manufacturable,
    )
      ? 'single'
      : values.stockControl
    const nextInitialStock =
      effectiveStockControl === 'by-brand'
        ? values.brands.reduce(
            (total, brand) =>
              total +
              (Number(brand.packageQuantity) || 0) * (Number(brand.packageCount) || 0),
            0,
          )
        : Number(values.initialStock)

    try {
      await mutateAsync({
        name: values.name,
        unit: values.unit,
        categories: values.categories,
        stockControl: effectiveStockControl,
        allowNegativeStock: values.allowNegativeStock,
        idealStock: Number(values.idealStock),
        initialStock: nextInitialStock,
        currentUnitCost:
          effectiveStockControl === 'single' &&
          values.categories.includes(ProductCategory.Ingredient) &&
          values.currentUnitCost.trim() !== ''
            ? Number(values.currentUnitCost)
            : undefined,
        brands:
          effectiveStockControl === 'by-brand'
            ? values.brands.map((brand) => ({
                name: brand.name,
                unit: brand.unit ?? values.unit,
                packageQuantity: Number(brand.packageQuantity) || 0,
                packageValue: Number(brand.packagePrice.replace(',', '.')) || 0,
                initialQuantity:
                  (Number(brand.packageQuantity) || 0) *
                  (Number(brand.packageCount) || 0),
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
    allowNegativeStock,
    brands,
    calculatedInitialStock,
    categories,
    fieldErrors: {
      categories: errors.categories?.message,
      idealStock: errors.idealStock?.message,
      name: errors.name?.message,
      currentUnitCost: errors.currentUnitCost?.message,
    },
    formError,
    handleAddBrand,
    handleAllowNegativeStockChange,
    handleBrandChange,
    handleIdealStockChange,
    handleInitialStockChange,
    handleCurrentUnitCostChange,
    handleNameChange,
    handleProductCategoryToggle,
    handleRegister: submitForm(handleRegister),
    handleRemoveBrand,
    handleStockControlChange,
    handleUnitChange,
    idealStock,
    initialStock,
    currentUnitCost,
    isCategoryDisabled,
    isPending,
    name,
    register,
    stockControl,
    unit,
  }
}
