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
  })
})

const RestClientConsumer = () => {
  const { restClient } = useRestContext()

  return (
    <span>{typeof restClient.get === 'function' ? 'REST client ready' : 'Missing'}</span>
  )
}
