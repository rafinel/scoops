import { useEffect, useId, useRef } from 'react'

import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

type AnalyticsRef = { current: ReturnType<typeof useAnalyticsContext> }
type ActiveWorkflowRef = { current: WorkflowHandle | undefined }

function endTrackedWorkflow(
  analyticsRef: AnalyticsRef,
  activeWorkflowRef: ActiveWorkflowRef,
) {
  const workflow = activeWorkflowRef.current
  if (!workflow) return
  analyticsRef.current.endWorkflow({ workflow })
  activeWorkflowRef.current = undefined
}

function startTrackedWorkflow(
  analyticsRef: AnalyticsRef,
  activeWorkflowRef: ActiveWorkflowRef,
  workflow: 'stock_entry',
  entryKey: string,
): WorkflowHandle<'stock_entry'>
function startTrackedWorkflow(
  analyticsRef: AnalyticsRef,
  activeWorkflowRef: ActiveWorkflowRef,
  workflow: 'stock_write_off',
  entryKey: string,
): WorkflowHandle<'stock_write_off'>
function startTrackedWorkflow(
  analyticsRef: AnalyticsRef,
  activeWorkflowRef: ActiveWorkflowRef,
  workflow: 'stock_entry' | 'stock_write_off',
  entryKey: string,
) {
  const handle =
    workflow === 'stock_entry'
      ? analyticsRef.current.startWorkflow({ workflow: 'stock_entry', entryKey })
      : analyticsRef.current.startWorkflow({ workflow: 'stock_write_off', entryKey })
  activeWorkflowRef.current = handle
  return handle
}

function createStockWorkflowActions(
  analyticsRef: AnalyticsRef,
  activeWorkflowRef: ActiveWorkflowRef,
  nextEntryKey: () => string,
) {
  return {
    endActiveWorkflow: () => endTrackedWorkflow(analyticsRef, activeWorkflowRef),
    startEntryWorkflow: () =>
      startTrackedWorkflow(
        analyticsRef,
        activeWorkflowRef,
        'stock_entry',
        nextEntryKey(),
      ),
    startWriteOffWorkflow: () =>
      startTrackedWorkflow(
        analyticsRef,
        activeWorkflowRef,
        'stock_write_off',
        nextEntryKey(),
      ),
  }
}

function useStockAnalyticsRef(): AnalyticsRef {
  const analytics = useAnalyticsContext()
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics
  return analyticsRef
}

function useStockEntryKeyFactory() {
  const entryKeyPrefix = useId()
  const nextEntryNumber = useRef(0)
  return () => `${entryKeyPrefix}:entry:${++nextEntryNumber.current}`
}

function useStockWorkflowState() {
  const analyticsRef = useStockAnalyticsRef()
  const nextEntryKey = useStockEntryKeyFactory()
  const activeWorkflowRef = useRef<WorkflowHandle | undefined>(undefined)
  return { activeWorkflowRef, analyticsRef, nextEntryKey }
}

export function useStockWorkflowTracker() {
  const { activeWorkflowRef, analyticsRef, nextEntryKey } = useStockWorkflowState()
  useEffect(
    () => () => endTrackedWorkflow(analyticsRef, activeWorkflowRef),
    [analyticsRef],
  )

  return createStockWorkflowActions(analyticsRef, activeWorkflowRef, nextEntryKey)
}
