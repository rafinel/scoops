import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries } from '@tanstack/react-query'
import { addRecipeIngredientSchema } from '@scoops/validation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import type {
  ProductCatalogRow,
  ProductStockDetails,
  RecipeIngredientDetails,
} from '@scoops/core/mrp/domain/structures'
import { useAddRecipeIngredientAction } from '@/ui/mrp/hooks/use-add-recipe-ingredient-action'
import { useUpdateRecipeIngredientAction } from '@/ui/mrp/hooks/use-update-recipe-ingredient-action'
import { useProductsQuery } from '@/ui/mrp/hooks/use-products-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type IngredientSource = {
  currentBalance: number
  name: string
  unitCost: number
}

type IngredientCandidate = ProductCatalogRow & {
  source?: IngredientSource
  unavailableReason?: string
}

type RecipeIngredientFormValues = z.infer<typeof addRecipeIngredientSchema>

export function useRecipeIngredientDialog({
  existingProductIds,
  ingredient,
  open,
  onSuccess,
  productId,
  recipeTotalCost,
}: {
  existingProductIds: readonly string[]
  ingredient?: RecipeIngredientDetails
  open: boolean
  onSuccess: () => void
  productId: string
  recipeTotalCost: number
}) {
  const addAction = useAddRecipeIngredientAction(productId)
  const updateAction = useUpdateRecipeIngredientAction(productId)
  const { mrpService } = useRestContext()
  const form = useForm<RecipeIngredientFormValues>({
    defaultValues: getDefaultValues(ingredient),
    resolver: zodResolver(addRecipeIngredientSchema),
  })
  const catalog = useProductsQuery({
    search: '',
    categories: ['ingredient'],
    sortBy: 'name',
    sortDirection: 'asc',
    page: 1,
  })
  const ingredientProductId = useWatch({
    control: form.control,
    name: 'ingredientProductId',
  })
  const quantity = useWatch({ control: form.control, name: 'quantity' })
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(ingredient))
      setActionError(null)
    }
  }, [form, ingredient, open])
  const baseCandidates = useMemo(
    () =>
      (catalog.data?.items ?? []).filter(
        ({ product }) =>
          product.id !== productId &&
          !existingProductIds.includes(product.id) &&
          product.status === 'active',
      ),
    [catalog.data?.items, existingProductIds, productId],
  )
  const candidateStocks = useQueries({
    queries: baseCandidates.map(({ product }) => ({
      queryKey: ['mrp', 'products', product.id, 'ingredient-source'],
      queryFn: async () => {
        const response = await mrpService.getProductStock(product.id)
        if (response.isFailure) response.throwError()
        return response.body
      },
      enabled: open && !ingredient,
      retry: false,
    })),
  })
  const candidates = useMemo<readonly IngredientCandidate[]>(
    () =>
      baseCandidates.map((candidate, index) =>
        buildCandidate(
          candidate,
          candidateStocks[index]?.data,
          candidateStocks[index]?.isError ?? false,
          candidateStocks[index]?.isPending ?? false,
        ),
      ),
    [baseCandidates, candidateStocks],
  )
  const selectedProduct = candidates.find(
    ({ product }) => product.id === ingredientProductId,
  )
  const selectedSource = selectedProduct?.source
  const numericQuantity = quantity ?? 0
  const previewLineCost =
    selectedSource && Number.isFinite(numericQuantity) && numericQuantity > 0
      ? selectedSource.unitCost * numericQuantity
      : 0
  const previewCogsPercentage =
    recipeTotalCost + previewLineCost === 0
      ? 0
      : (previewLineCost / (recipeTotalCost + previewLineCost)) * 100
  function handleIngredientProductChange(value: string | null) {
    form.setValue('ingredientProductId', value ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })
    setActionError(null)
  }

  function handleQuantityChange() {
    setActionError(null)
  }

  async function handleValidSubmit(values: RecipeIngredientFormValues) {
    try {
      if (ingredient) {
        await updateAction.updateRecipeIngredient({
          lineId: ingredient.id,
          input: { quantity: values.quantity },
        })
      } else {
        await addAction.addRecipeIngredient({
          ingredientProductId: values.ingredientProductId,
          quantity: values.quantity,
        })
      }
      onSuccess()
    } catch {
      setActionError('Não foi possível salvar o ingrediente. Tente novamente.')
    }
  }

  return {
    actionError,
    candidates,
    errors: form.formState.errors,
    handleIngredientProductChange,
    handleQuantityChange,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    ingredientProductId,
    isPending: addAction.isPending || updateAction.isPending,
    quantity,
    selectedProduct,
    selectedSource,
    previewCogsPercentage,
    previewLineCost,
    register: form.register,
  }
}

function getDefaultValues(
  ingredient?: RecipeIngredientDetails,
): Partial<RecipeIngredientFormValues> {
  return ingredient
    ? {
        ingredientProductId: ingredient.ingredientProductId,
        quantity: ingredient.quantity,
      }
    : { ingredientProductId: '' }
}

function buildCandidate(
  candidate: ProductCatalogRow,
  stock: ProductStockDetails | undefined,
  isStockError: boolean,
  isStockPending: boolean,
): IngredientCandidate {
  if (isStockPending) {
    return { ...candidate, unavailableReason: 'Consultando fonte atual…' }
  }

  if (isStockError || !stock) {
    return {
      ...candidate,
      unavailableReason: 'Não foi possível consultar a fonte atual.',
    }
  }

  if (candidate.product.stockControl === ProductStockControl.Single) {
    if (candidate.product.currentUnitCost === undefined) {
      return { ...candidate, unavailableReason: 'Sem custo unitário atual.' }
    }
    return {
      ...candidate,
      source: {
        currentBalance: stock.stockQuantity,
        name: 'Estoque único',
        unitCost: candidate.product.currentUnitCost,
      },
    }
  }

  const primaryBrand = stock.brands.find(({ brand }) => brand.isPrimary)
  if (!primaryBrand) {
    return { ...candidate, unavailableReason: 'Sem marca principal atual.' }
  }

  return {
    ...candidate,
    source: {
      currentBalance: primaryBrand.stockQuantity,
      name: primaryBrand.brand.name,
      unitCost: primaryBrand.unitPrice,
    },
  }
}
