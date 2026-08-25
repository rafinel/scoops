import { useEffect, useRef, useState } from 'react'
import type { z } from 'zod'

import type { ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { productSettingsSearchSchema } from '@scoops/validation'

import { useProductSettingsQuery } from '@/ui/mrp/hooks/use-product-settings-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type ProductSettingsSearch = z.infer<typeof productSettingsSearchSchema>

export type ProductSettingsSlotProps = {
  productId: string
  retrySearch: ProductSettingsSearch
}

export function useProductSettingsSlot(
  productId: string,
  retrySearch: ProductSettingsSearch,
) {
  const query = useProductSettingsQuery(productId)
  const { navigateTo } = useNavigation()
  const [targetUnit, setTargetUnit] = useState<ProductUnit>()
  const [isUnitDialogOpen, setUnitDialogOpen] = useState(false)
  const [isRemovalDialogOpen, setRemovalDialogOpen] = useState(false)
  const unitTriggerRef = useRef<HTMLElement | null>(null)
  const removalTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!targetUnit && !isUnitDialogOpen) {
      unitTriggerRef.current?.focus()
      unitTriggerRef.current = null
    }
  }, [isUnitDialogOpen, targetUnit])

  useEffect(() => {
    if (isRemovalDialogOpen) return
    removalTriggerRef.current?.focus()
    removalTriggerRef.current = null
  }, [isRemovalDialogOpen])

  function handleBack() {
    void navigateTo('products')
  }

  function handleRetry() {
    void query.retrySettings()
  }

  function handleUnitChange(nextUnit: ProductUnit, trigger: HTMLElement) {
    unitTriggerRef.current = trigger
    setTargetUnit(nextUnit)
    setUnitDialogOpen(true)
  }

  function handleUnitDialogOpenChange(open: boolean) {
    setUnitDialogOpen(open)
    if (!open) setTargetUnit(undefined)
  }

  function handleOpenRemoval(trigger: HTMLElement) {
    removalTriggerRef.current = trigger
    setRemovalDialogOpen(true)
  }

  function handleRemovalOpenChange(open: boolean) {
    setRemovalDialogOpen(open)
  }

  return {
    settings: query.settings,
    settingsError: query.settingsError,
    hasSettingsError: query.hasSettingsError,
    isLoadingSettings: query.isLoadingSettings,
    targetUnit,
    isUnitDialogOpen,
    isRemovalDialogOpen,
    retrySearch,
    handleBack,
    handleRetry,
    handleUnitChange,
    handleUnitDialogOpenChange,
    handleOpenRemoval,
    handleRemovalOpenChange,
  }
}
