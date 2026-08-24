import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BrandSection } from '../index'

const brands = [
  {
    id: 'brand-1',
    name: 'Frooty',
    packageQuantity: '1',
    packagePrice: '12,50',
    packageCount: '2',
    isPrimary: true,
  },
]

describe('BrandSection', () => {
  afterEach(cleanup)

  it('renders brands and delegates add, edit and remove actions', () => {
    const onAdd = vi.fn()
    const onChange = vi.fn()
    const onRemove = vi.fn()
    render(
      <BrandSection
        brands={brands}
        onAdd={onAdd}
        onChange={onChange}
        onRemove={onRemove}
        unit='kg'
      />,
    )

    expect(screen.getByRole('heading', { name: 'Marcas do produto' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar marca' }))
    fireEvent.change(screen.getByDisplayValue('Frooty'), { target: { value: 'Açaí' } })
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('brand-1', { name: 'Açaí' })
    expect(onRemove).not.toHaveBeenCalled()
  })
})
