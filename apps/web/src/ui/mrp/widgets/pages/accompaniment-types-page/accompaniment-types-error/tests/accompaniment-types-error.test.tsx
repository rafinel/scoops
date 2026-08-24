import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AccompanimentTypesError } from '../index'

describe('AccompanimentTypesError', () => {
  it('exposes a retry action', () => {
    const onRetry = vi.fn()
    render(<AccompanimentTypesError onRetry={onRetry} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar os tipos',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
