import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

export function AnalyticsConsumerFixture() {
  const analytics = useAnalyticsContext()

  function emitValidEvents() {
    const onboarding = analytics.startWorkflow({
      workflow: 'onboarding',
      entryKey: 'fixture-onboarding-entry',
    })
    const onboardingAttempt = analytics.startAttempt({ workflow: onboarding })
    analytics.recordValidationFailure({
      attempt: onboardingAttempt,
      fields: ['email'],
    })
    analytics.recordBlock({
      workflow: onboarding,
      block: {
        phase: 'validation',
        failureCode: 'invalid_input',
        fields: ['password'],
      },
    })
    analytics.recordBlock({ workflow: onboarding, block: null })
    analytics.recordFailure({
      attempt: onboardingAttempt,
      phase: 'submission',
      failureCode: 'network_error',
      statusClass: '5xx',
    })
    analytics.completeWorkflow({
      attempt: onboardingAttempt,
      onboardingExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
    analytics.recordEmailConfirmation({
      observationKey: 'fixture-confirmation-request',
      workflow: onboarding,
      outcome: 'success',
    })
    analytics.recordAccountActivationFailure({
      observationKey: 'fixture-activation-request',
      workflow: onboarding,
      failureCode: 'network_error',
      statusClass: '5xx',
    })

    emitProductCreationEvents(analytics)
    emitStockEntryEvents(analytics)
    emitStockWriteOffEvents(analytics)

    const production = analytics.startWorkflow({
      workflow: 'production',
      entryKey: 'fixture-production-entry',
    })
    analytics.recordBlock({
      workflow: production,
      block: {
        phase: 'validation',
        failureCode: 'invalid_input',
        fields: ['batches'],
      },
    })
    analytics.recordBlock({ workflow: production, block: null })
    analytics.recordBlock({
      workflow: production,
      block: {
        phase: 'preview',
        failureCode: 'insufficient_stock',
        fields: ['quantity'],
      },
    })
    analytics.recordFailure({
      workflow: production,
      observationKey: 'fixture-production-preview',
      phase: 'preview',
      failureCode: 'dependency_unavailable',
      statusClass: '5xx',
    })
    const productionAttempt = analytics.startAttempt({ workflow: production })
    analytics.recordFailure({
      attempt: productionAttempt,
      phase: 'submission',
      failureCode: 'unknown',
    })
    analytics.completeWorkflow({ attempt: productionAttempt })
  }

  function emitMalformedEvents() {
    const entry = analytics.startWorkflow({
      workflow: 'stock_entry',
      entryKey: 'fixture-malformed-entry',
    })
    const attempt = analytics.startAttempt({ workflow: entry })

    const recordValidationFailure = analytics.recordValidationFailure as (
      input: unknown,
    ) => void
    recordValidationFailure({
      attempt,
      fields: ['brands'],
      sentinel: 'PRIVATE_SENTINEL',
    })
    recordValidationFailure({ attempt: {}, fields: ['quantity'] })

    const recordBlock = analytics.recordBlock as (input: unknown) => void
    recordBlock({
      workflow: entry,
      block: {
        phase: 'preview',
        failureCode: 'insufficient_stock',
        fields: ['quantity'],
      },
    })

    const production = analytics.startWorkflow({
      workflow: 'production',
      entryKey: 'fixture-malformed-production',
    })
    recordBlock({
      workflow: production,
      block: {
        phase: 'validation',
        failureCode: 'insufficient_stock',
        fields: ['batches'],
      },
    })
  }

  function emitPostCompletionRetry() {
    const workflow = analytics.startWorkflow({
      workflow: 'product_creation',
      entryKey: 'fixture-post-completion-retry',
    })
    const firstAttempt = analytics.startAttempt({ workflow })
    analytics.completeWorkflow({ attempt: firstAttempt })

    const retryAttempt = analytics.startAttempt({ workflow })
    analytics.completeWorkflow({ attempt: retryAttempt })
  }

  return (
    <section aria-label='Analytics test consumer'>
      <button onClick={emitValidEvents} type='button'>
        Emit analytics contract events
      </button>
      <button onClick={emitMalformedEvents} type='button'>
        Emit malformed analytics candidates
      </button>
      <button onClick={emitPostCompletionRetry} type='button'>
        Emit completion retry analytics
      </button>
    </section>
  )
}

function emitProductCreationEvents(analytics: ReturnType<typeof useAnalyticsContext>) {
  const handle = analytics.startWorkflow({
    workflow: 'product_creation',
    entryKey: 'fixture-product-creation-entry',
  })
  const attempt = analytics.startAttempt({ workflow: handle })
  analytics.recordValidationFailure({ attempt, fields: ['name'] })
  analytics.recordBlock({
    workflow: handle,
    block: {
      phase: 'validation',
      failureCode: 'invalid_input',
      fields: ['name'],
    },
  })
  analytics.recordBlock({ workflow: handle, block: null })
  analytics.recordFailure({
    attempt,
    phase: 'submission',
    failureCode: 'network_error',
    statusClass: '5xx',
  })
  analytics.completeWorkflow({ attempt })
}

function emitStockEntryEvents(analytics: ReturnType<typeof useAnalyticsContext>) {
  const handle = analytics.startWorkflow({
    workflow: 'stock_entry',
    entryKey: 'fixture-stock-entry',
  })
  const attempt = analytics.startAttempt({ workflow: handle })
  analytics.recordValidationFailure({ attempt, fields: ['quantity'] })
  analytics.recordBlock({
    workflow: handle,
    block: {
      phase: 'validation',
      failureCode: 'invalid_input',
      fields: ['quantity'],
    },
  })
  analytics.recordBlock({ workflow: handle, block: null })
  analytics.recordFailure({
    attempt,
    phase: 'submission',
    failureCode: 'network_error',
    statusClass: '5xx',
  })
  analytics.completeWorkflow({ attempt })
}

function emitStockWriteOffEvents(analytics: ReturnType<typeof useAnalyticsContext>) {
  const handle = analytics.startWorkflow({
    workflow: 'stock_write_off',
    entryKey: 'fixture-stock-write-off-entry',
  })
  const attempt = analytics.startAttempt({ workflow: handle })
  analytics.recordValidationFailure({ attempt, fields: ['quantity'] })
  analytics.recordBlock({
    workflow: handle,
    block: {
      phase: 'validation',
      failureCode: 'invalid_input',
      fields: ['quantity'],
    },
  })
  analytics.recordBlock({ workflow: handle, block: null })
  analytics.recordFailure({
    attempt,
    phase: 'submission',
    failureCode: 'network_error',
    statusClass: '5xx',
  })
  analytics.completeWorkflow({ attempt })
}
