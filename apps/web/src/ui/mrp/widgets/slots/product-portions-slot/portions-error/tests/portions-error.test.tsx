import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PortionsError } from '../index'

describe('PortionsError', () => {
  afterEach(cleanup)

  it('announces the failure and retries on demand', () => {
    const onRetry = vi.fn()
    render(<PortionsError onRetry={onRetry} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar as porções.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
