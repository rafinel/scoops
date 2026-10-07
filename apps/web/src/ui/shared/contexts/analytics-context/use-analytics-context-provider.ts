import { useEffect, useMemo, useRef, useState } from 'react'

import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ProductTelemetryFeature } from '@scoops/core/shared/interfaces'

import { ROUTES } from '@/constants/routes'
import { createPostHogProductTelemetryProvider } from '@/provision/telemetry/posthog-product-telemetry-provider'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'

import type { AnalyticsContextValue } from './types/analytics-context-value'

const FEATURE_DESTINATIONS: readonly {
  pathname: string
  feature: ProductTelemetryFeature
  profiles?: readonly (typeof UserProfile)[keyof typeof UserProfile][]
}[] = [
  { pathname: ROUTES.app, feature: 'dashboard', profiles: [UserProfile.Manager] },
  { pathname: ROUTES.products, feature: 'products' },
  { pathname: ROUTES.newSale, feature: 'new_sale' },
  { pathname: ROUTES.orders, feature: 'orders' },
  { pathname: ROUTES.salesChannels, feature: 'sales_channels' },
  { pathname: ROUTES.discounts, feature: 'discounts' },
  { pathname: ROUTES.users, feature: 'users', profiles: [UserProfile.Manager] },
  {
    pathname: ROUTES.shopSettings,
    feature: 'shop_settings',
    profiles: [UserProfile.Manager],
  },
  {
    pathname: ROUTES.subscription,
    feature: 'subscription',
    profiles: [UserProfile.Manager],
  },
  { pathname: ROUTES.account, feature: 'account' },
  { pathname: ROUTES.notifications, feature: 'notifications' },
]

type DestinationEntry = {
  pathname: string
  entryKey: string
  recorded: boolean
}

type AuthorizedDestinationVisitInput = {
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>
  pathname: string
  status: string
  account: Account | null
}

export function useAnalyticsContextProvider(): AnalyticsContextValue {
  const { status, account } = useAuthContext()
  const { pathname } = useUrlPathname()
  const [runtime] = useState(() => createPostHogProductTelemetryProvider())
  const value = useAnalyticsContextValue(runtime)
  useAnalyticsRuntimeObservations(runtime, status, account, pathname)

  return value
}

function useAnalyticsRuntimeObservations(
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>,
  status: ReturnType<typeof useAuthContext>['status'],
  account: Account | null,
  pathname: string,
): void {
  useAnalyticsRuntimeLifecycle(runtime)
  useResolvedAnalyticsIdentity(runtime, status, account)
  useAuthorizedDestinationVisit({ runtime, pathname, status, account })
}

function useAnalyticsContextValue(
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>,
): AnalyticsContextValue {
  return useMemo(
    () => ({
      startWorkflow: runtime.startWorkflow.bind(runtime),
      startAttempt: runtime.startAttempt.bind(runtime),
      recordValidationFailure: runtime.recordValidationFailure.bind(runtime),
      recordBlock: runtime.recordBlock.bind(runtime),
      recordFailure: runtime.recordFailure.bind(runtime),
      completeWorkflow: runtime.completeWorkflow.bind(runtime),
      endWorkflow: runtime.endWorkflow.bind(runtime),
      recordEmailConfirmation: runtime.recordEmailConfirmation.bind(runtime),
      recordAccountActivationFailure:
        runtime.recordAccountActivationFailure.bind(runtime),
      recordFeatureVisit: runtime.recordFeatureVisit.bind(runtime),
    }),
    [runtime],
  )
}

function useAnalyticsRuntimeLifecycle(
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>,
): void {
  useEffect(() => {
    runtime.activate()
    const unsubscribe = runtime.subscribeToPeerInvalidation(() => undefined)
    return () => {
      unsubscribe()
      runtime.dispose()
    }
  }, [runtime])
}

function useResolvedAnalyticsIdentity(
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>,
  status: ReturnType<typeof useAuthContext>['status'],
  account: Account | null,
): void {
  useEffect(() => {
    runtime.reconcileIdentity({ status, account })
  }, [account, runtime, status])
}

function useAuthorizedDestinationVisit({
  runtime,
  pathname,
  status,
  account,
}: AuthorizedDestinationVisitInput): void {
  const destinationEntryRef = useRef<DestinationEntry | undefined>(undefined)
  useDestinationVisitEffect({ runtime, pathname, status, account }, destinationEntryRef)
}

type DestinationEntryRef = { current: DestinationEntry | undefined }

function useDestinationVisitEffect(
  { runtime, pathname, status, account }: AuthorizedDestinationVisitInput,
  destinationEntryRef: DestinationEntryRef,
): void {
  useEffect(
    () =>
      recordCurrentDestinationVisit({
        runtime,
        pathname,
        status,
        account,
        entryRef: destinationEntryRef,
      }),
    [account, destinationEntryRef, pathname, runtime, status],
  )
}

function recordCurrentDestinationVisit({
  runtime,
  pathname,
  status,
  account,
  entryRef,
}: {
  runtime: ReturnType<typeof createPostHogProductTelemetryProvider>
  pathname: string
  status: string
  account: Account | null
  entryRef: { current: DestinationEntry | undefined }
}): void {
  entryRef.current = getDestinationEntry(entryRef.current, pathname)
  recordAuthorizedFeatureVisit(pathname, status, account, entryRef.current, runtime)
}

function getDestinationEntry(
  current: DestinationEntry | undefined,
  pathname: string,
): DestinationEntry {
  if (current?.pathname === pathname) return current
  return { pathname, entryKey: createVisitEntryKey(), recorded: false }
}

function recordAuthorizedFeatureVisit(
  pathname: string,
  status: string,
  account: Account | null,
  entry: DestinationEntry,
  runtime: AnalyticsContextValue,
): void {
  if (entry.recorded || status !== 'authenticated' || !account) return
  const destination = getAuthorizedFeatureDestination(pathname, account.profile)
  if (!destination) return
  runtime.recordFeatureVisit({ feature: destination.feature, entryKey: entry.entryKey })
  entry.recorded = true
}

function getAuthorizedFeatureDestination(pathname: string, profile: Account['profile']) {
  return FEATURE_DESTINATIONS.find(
    (destination) =>
      destination.pathname === pathname &&
      (!destination.profiles || destination.profiles.includes(profile)),
  )
}

function createVisitEntryKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
