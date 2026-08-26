import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { RestContextProvider } from '..'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => ({
    getSession: vi.fn().mockResolvedValue(null),
  }),
}))

describe('Rest Context', () => {
  afterEach(cleanup)

  it('provides the configured REST client', () => {
    render(
      <RestContextProvider>
        <RestClientConsumer />
      </RestContextProvider>,
    )

    expect(screen.getByText('REST client ready').textContent).toBe('REST client ready')
    expect(screen.getByText('PDV service ready').textContent).toBe('PDV service ready')
  })
})

const RestClientConsumer = () => {
  const { pdvService, restClient } = useRestContext()

  return (
    <>
      <span>
        {typeof restClient.get === 'function' ? 'REST client ready' : 'Missing'}
      </span>
      <span>
        {typeof pdvService.listSalesChannels === 'function'
          ? 'PDV service ready'
          : 'Missing'}
      </span>
    </>
  )
}
