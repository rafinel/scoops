import { useEffect, useId, useRef } from 'react'

import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

function endProductionWorkflow(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflow: WorkflowHandle<'production'>,
  workflowRef: { current: WorkflowHandle<'production'> | undefined },
) {
  analyticsRef.current.endWorkflow({ workflow })
  if (workflowRef.current === workflow) workflowRef.current = undefined
}

function manageProductionWorkflow(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  entryKey: string | undefined,
  workflowRef: { current: WorkflowHandle<'production'> | undefined },
) {
  if (!entryKey) return
  const workflow = analyticsRef.current.startWorkflow({
    workflow: 'production',
    entryKey,
  })
  workflowRef.current = workflow
  return () => endProductionWorkflow(analyticsRef, workflow, workflowRef)
}

function useProductionEntryKey(open: boolean, prefix: string) {
  const wasOpen = useRef(false)
  const openCount = useRef(0)
  if (open && !wasOpen.current) openCount.current += 1
  wasOpen.current = open
  return open ? `${prefix}:open:${openCount.current}` : undefined
}

function useCurrentAnalyticsRef() {
  const analytics = useAnalyticsContext()
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics
  return analyticsRef
}

function useProductionWorkflowRef(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  entryKey: string | undefined,
) {
  const workflowRef = useRef<WorkflowHandle<'production'> | undefined>(undefined)
  useEffect(
    () => manageProductionWorkflow(analyticsRef, entryKey, workflowRef),
    [entryKey, analyticsRef],
  )
  return workflowRef
}

export function useProductionWorkflow(open: boolean) {
  const analyticsRef = useCurrentAnalyticsRef()
  const entryKey = useProductionEntryKey(open, useId())
  const workflowRef = useProductionWorkflowRef(analyticsRef, entryKey)
  return { analyticsRef, entryKey, workflowRef }
}
