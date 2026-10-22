import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentBrandField, type AccompanimentBrandFieldProps } from '../index'

function renderField(overrides: Partial<AccompanimentBrandFieldProps> = {}) {
  return render(
    <AccompanimentBrandField
      brandName='Mãe Terra'
      retrySelectedStock={vi.fn()}
      selectedStockError={false}
      {...overrides}
    />,
  )
}

describe('AccompanimentBrandField', () => {
  afterEach(cleanup)

  it('shows the current brand as a read-only value', () => {
    renderField()

    const input = screen.getByLabelText('Marca atual') as HTMLInputElement
    expect(input.value).toBe('Mãe Terra')
    expect(input.disabled).toBe(true)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('announces a stock read failure with a retry action', () => {
    const retrySelectedStock = vi.fn()
    renderField({ retrySelectedStock, selectedStockError: true })

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar a marca e o custo atuais.',
    )
    fireEvent.click(screen.getByText('Tentar novamente'))

    expect(retrySelectedStock).toHaveBeenCalledTimes(1)
  })
})
