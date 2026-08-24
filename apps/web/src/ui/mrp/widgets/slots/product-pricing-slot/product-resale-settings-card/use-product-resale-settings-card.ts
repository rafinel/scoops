import { useEffect, useState } from 'react'

import { resaleConfigurationFormSchema } from '@scoops/validation'
import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

import { useSaveProductResaleConfigurationAction } from '@/ui/mrp/hooks/use-save-product-resale-configuration-action'
import { formatDecimal } from '@/ui/shared/hooks/use-format-decimal'

type ResaleTarget = {
  brandId?: string
  isActive: boolean
  price: string
}

export type ProductResaleRowState = ResaleTarget & {
  error?: string
  isPending: boolean
}

export function useProductResaleSettingsCard(
  details: ProductPricingDetails,
  productId: string,
) {
  const saveAction = useSaveProductResaleConfigurationAction(productId)
  const [rows, setRows] = useState<Record<string, ProductResaleRowState>>({})

  useEffect(() => {
    const nextRows: Record<string, ProductResaleRowState> = {}
    for (const item of details.resale) {
      const key = item.brand?.id ?? 'single'
      nextRows[key] = {
        brandId: item.brand?.id,
        isActive: item.configuration?.isActive ?? false,
        isPending: false,
        price: item.configuration ? formatDecimal(item.configuration.price) : '',
      }
    }
    setRows(nextRows)
  }, [details.resale])

  function handleValueChange(
    key: string,
    field: 'price' | 'isActive',
    value: string | boolean,
  ) {
    setRows((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value, error: undefined },
    }))
  }

  async function handleSave(key: string) {
    const row = rows[key]
    if (!row || row.isPending) return

    const result = resaleConfigurationFormSchema.safeParse({
      isActive: row.isActive,
      price: row.price,
    })
    if (!result.success) {
      setRows((current) => ({
        ...current,
        [key]: { ...current[key], error: result.error.issues[0]?.message },
      }))
      return
    }

    setRows((current) => ({
      ...current,
      [key]: { ...current[key], error: undefined, isPending: true },
    }))
    try {
      await saveAction.saveProductResaleConfiguration({
        brandId: row.brandId,
        input: {
          isActive: row.isActive,
          price: Number(result.data.price.replace(',', '.')),
        },
      })
    } catch (caught) {
      setRows((current) => ({
        ...current,
        [key]: {
          ...current[key],
          error:
            caught instanceof Error && caught.message
              ? caught.message
              : 'Não foi possível salvar. Tente novamente.',
          isPending: false,
        },
      }))
      return
    }
    setRows((current) => ({ ...current, [key]: { ...current[key], isPending: false } }))
  }

  return {
    handleSave,
    handleValueChange,
    rows,
  }
}
