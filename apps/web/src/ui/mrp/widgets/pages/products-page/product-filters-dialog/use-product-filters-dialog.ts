import { useEffect, useState } from 'react'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'

export function useProductFiltersDialog({
  isOpen,
  onOpenChange,
  onSearchChange,
  search,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSearchChange: (search: ProductsSearch) => void
  search: ProductsSearch
}) {
  const [draftCategories, setDraftCategories] = useState<ProductCategory[]>([])
  const [draftStatus, setDraftStatus] = useState<'active' | 'inactive' | undefined>()
  const [draftStockSituation, setDraftStockSituation] = useState<
    'normal' | 'low' | undefined
  >()

  useEffect(() => {
    if (!isOpen) return
    setDraftCategories(search.categories)
    setDraftStatus(search.status)
    setDraftStockSituation(search.stockSituation)
  }, [isOpen, search])

  function handleCategoryToggle(category: ProductCategory) {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    )
  }

  function handleStockSituationToggle(value: 'normal' | 'low') {
    setDraftStockSituation((current) => (current === value ? undefined : value))
  }

  function handleStatusToggle(value: 'active' | 'inactive') {
    setDraftStatus((current) => (current === value ? undefined : value))
  }

  function handleClear() {
    setDraftCategories([])
    setDraftStatus(undefined)
    setDraftStockSituation(undefined)
  }

  function handleApply() {
    onSearchChange({
      ...search,
      categories: draftCategories,
      status: draftStatus,
      stockSituation: draftStockSituation,
      page: 1,
    })
    onOpenChange(false)
  }

  return {
    draftCategories,
    draftStatus,
    draftStockSituation,
    filterGroupCount:
      Number(draftCategories.length > 0) +
      Number(draftStockSituation !== undefined) +
      Number(draftStatus !== undefined),
    handleApply,
    handleCategoryToggle,
    handleClear,
    handleStatusToggle,
    handleStockSituationToggle,
  }
}
