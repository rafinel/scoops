import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductAccompanimentsError } from '../index'

describe('ProductAccompanimentsError', () => {
  it('exposes the failure message and delegates retry', () => {
    const onRetry = vi.fn()

    render(<ProductAccompanimentsError onRetry={onRetry} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar os acompanhamentos',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
