import { useEffect, useRef, useState } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductStatus, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { productSettingsFormSchema } from '@scoops/validation'

import {
  type ProductSettingsField,
  useUpdateProductSettingsAction,
} from '@/ui/mrp/hooks/use-update-product-settings-action'

export function useBasicInformationCard(
  product: Product,
  onUnitChange: (unit: ProductUnit, trigger: HTMLElement) => void,
) {
  const updateAction = useUpdateProductSettingsAction(product.id)
  const unitTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [name, setName] = useState(product.name)
  const [idealStock, setIdealStock] = useState(
    product.idealStock === undefined ? '' : String(product.idealStock),
  )
  const [status, setStatus] = useState<ProductStatus>(product.status)
  const [errors, setErrors] = useState<Partial<Record<ProductSettingsField, string>>>({})
  const statusSaveQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const statusExpectedUpdatedAtRef = useRef(product.updatedAt)

  useEffect(() => {
    setName(product.name)
    setIdealStock(product.idealStock === undefined ? '' : String(product.idealStock))
    setStatus(product.status)
    setErrors({})
    statusExpectedUpdatedAtRef.current = product.updatedAt
  }, [product])

  function getError(result: {
    success: false
    error: { issues: { message?: string }[] }
  }) {
    return result.error.issues[0]?.message ?? 'Revise este campo.'
  }

  async function saveField(
    field: 'name' | 'idealStock' | 'status',
    override?: { status?: ProductStatus },
    expectedUpdatedAt = product.updatedAt,
  ) {
    const values = {
      name,
      idealStock,
      status: override?.status ?? status,
      allowNegativeStock: Boolean(product.allowNegativeStock),
      internalNotes: product.internalNotes ?? '',
    }
    const result = productSettingsFormSchema.safeParse(values)
    if (!result.success) {
      const issue = result.error.issues.find((item) => item.path[0] === field)
      setErrors((current) => ({
        ...current,
        [field]: issue?.message ?? getError(result),
      }))
      return
    }
    setErrors((current) => ({ ...current, [field]: undefined }))
    try {
      const input =
        field === 'name'
          ? { name: result.data.name, expectedUpdatedAt }
          : field === 'idealStock'
            ? {
                idealStock:
                  result.data.idealStock === null
                    ? null
                    : Number(String(result.data.idealStock).replace(',', '.')),
                expectedUpdatedAt,
              }
            : { status: result.data.status, expectedUpdatedAt }
      const savedSettings = await updateAction.updateProductSettings({ field, input })
      if (field === 'status') {
        statusExpectedUpdatedAtRef.current = savedSettings.product.updatedAt
      }
      return true
    } catch (caught) {
      setErrors((current) => ({
        ...current,
        [field]:
          caught instanceof Error && caught.message
            ? caught.message
            : 'Não foi possível salvar. Tente novamente.',
      }))
      return false
    }
  }

  function queueStatusSave(value: ProductStatus) {
    const nextSave = statusSaveQueueRef.current.then(() =>
      saveField('status', { status: value }, statusExpectedUpdatedAtRef.current),
    )
    statusSaveQueueRef.current = nextSave.catch(() => undefined)
    void nextSave
  }

  function handleStatusChange(value: ProductStatus) {
    setStatus(value)
    queueStatusSave(value)
  }

  function handleUnitChange(value: ProductUnit) {
    if (value === product.unit) return
    const trigger = unitTriggerRef.current
    if (trigger) onUnitChange(value, trigger)
  }

  function handleRetry(field: 'name' | 'idealStock' | 'status') {
    if (field === 'status') {
      queueStatusSave(status)
      return
    }
    void saveField(field)
  }

  function handleRevert(field: 'name' | 'idealStock' | 'status') {
    if (field === 'name') setName(product.name)
    if (field === 'idealStock') {
      setIdealStock(product.idealStock === undefined ? '' : String(product.idealStock))
    }
    if (field === 'status') setStatus(product.status)
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  return {
    errors,
    handleNameChange: setName,
    handleIdealStockChange: setIdealStock,
    handleNameBlur: () => void saveField('name'),
    handleIdealStockBlur: () => void saveField('idealStock'),
    handleRetry,
    handleRevert,
    handleStatusChange,
    handleUnitChange,
    isPending: updateAction.isUpdatingProductSettings,
    pendingField: updateAction.updatingProductSettingsField,
    name,
    idealStock,
    status,
    unitTriggerRef,
  }
}
