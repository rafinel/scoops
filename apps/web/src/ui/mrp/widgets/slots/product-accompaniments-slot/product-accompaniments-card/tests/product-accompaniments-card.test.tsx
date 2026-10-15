import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductAccompanimentsDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentsCard } from '../index'

const details: ProductAccompanimentsDetails = {
  product: ProductFaker.fake({ categories: ['portion'], name: 'Açaí especial' }),
  accompaniments: [
    {
      id: 'link-1',
      accompanimentProductId: 'product-2',
      accompanimentProductName: 'Granola',
      accompanimentTypeId: 'type-1',
      accompanimentTypeName: 'Cobertura',
      unit: 'g',
      quantityPerPortion: 20,
      salePrice: 3,
      brandName: 'Marca atual',
      estimatedCost: 0.45,
    },
  ],
}

describe('ProductAccompanimentsCard', () => {
  it('renders the configured table and delegates add, edit and remove actions', () => {
    const onAdd = vi.fn()
    const onEdit = vi.fn()
    const onRemove = vi.fn()

    render(
      <ProductAccompanimentsCard
        details={details}
        onAdd={onAdd}
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Vincular acompanhamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar Granola' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Granola' }))

    expect(
      screen.getByRole('heading', { name: /Acompanhamentos \(1\)/ }).textContent,
    ).toContain('(1)')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(details.accompaniments[0])
    expect(onRemove).toHaveBeenCalledWith(details.accompaniments[0])
  })

  it('distinguishes free and unconfigured shared product prices', () => {
    const accompaniment = details.accompaniments[0]
    if (!accompaniment) throw new Error('Expected an accompaniment fixture')

    render(
      <ProductAccompanimentsCard
        details={{
          ...details,
          accompaniments: [
            { ...accompaniment, id: 'free-link', salePrice: 0 },
            { ...accompaniment, id: 'unset-link', salePrice: null },
          ],
        }}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('Grátis')).toBeTruthy()
    expect(screen.getByText('Não configurado')).toBeTruthy()
  })
})
