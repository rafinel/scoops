import { type MouseEvent, useState } from 'react'
import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'
import { useRouter } from '@tanstack/react-router'

import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'

export type AccompanimentTypesAction =
  | { kind: 'create' }
  | { kind: 'edit' | 'remove'; item: AccompanimentTypeListItem }

export function useAccompanimentTypesPage(
  page: number,
  onPageChange: (page: number) => void,
) {
  const router = useRouter()
  const query = useAccompanimentTypesQuery({ page, pageSize: 10 })
  const [selectedAction, setSelectedAction] = useState<AccompanimentTypesAction>()
  function handleActionOpenChange(open: boolean) {
    if (!open) setSelectedAction(undefined)
  }
  function handleActionSuccess() {
    setSelectedAction(undefined)
    void query.refetch()
  }
  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    if (!router.history.canGoBack()) return
    event.preventDefault()
    router.history.back()
  }
  return {
    data: query.data,
    isError: query.isError,
    isLoading: query.isPending,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleRetry: () => void query.refetch(),
    onPageChange,
    selectedAction,
    setSelectedAction,
  }
}
