import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BrandEditor } from '../index'

const brand = {
  id: 'brand-1',
  name: 'Frooty',
  packageQuantity: '1',
  packagePrice: '12,50',
  packageCount: '2',
  isPrimary: true,
}

describe('BrandEditor', () => {
  afterEach(cleanup)

  it('updates fields and protects the first brand from removal', () => {
    const onChange = vi.fn()
    const onRemove = vi.fn()
    const { rerender } = render(
      <BrandEditor
        allowNegativeStock={false}
        brand={brand}
        index={0}
        onChange={onChange}
        onRemove={onRemove}
        unit='kg'
      />,
    )

    fireEvent.change(screen.getByDisplayValue('Frooty'), {
      target: { value: 'Nova marca' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ name: 'Nova marca' })
    expect(onChange).toHaveBeenCalledWith({ isPrimary: false })
    expect(
      screen.getByRole('button', { name: 'Remover marca 1' }).hasAttribute('disabled'),
    ).toBe(true)

    rerender(
      <BrandEditor
        allowNegativeStock={false}
        brand={{ ...brand, id: 'brand-2' }}
        index={1}
        onChange={onChange}
        onRemove={onRemove}
        unit='kg'
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover marca 2' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
