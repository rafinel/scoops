import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { ProductAccompanimentsTable } from './index'

describe('ProductAccompanimentsTable', () => {
  afterEach(cleanup)

  it('exposes unavailable source and price without hiding the row', () => {
    render(
      <ProductAccompanimentsTable
        items={[
          {
            id: 'link-1',
            accompanimentProductId: 'product-1',
            accompanimentProductName: 'Granola',
            accompanimentTypeId: 'type-1',
            accompanimentTypeName: 'Cobertura',
            unit: 'g',
            quantityPerPortion: 20,
            estimatedCost: 0.45,
          },
        ]}
        onEdit={() => undefined}
        onRemove={() => undefined}
      />,
    )
    expect(screen.getByText('Granola')).toBeTruthy()
    expect(screen.getAllByText('Não disponível')).toHaveLength(1)
    expect(
      screen.getByLabelText(/preço comercial é configurado por tamanho no PDV/i),
    ).toBeTruthy()
    expect(screen.getByText('Indisponível')).toBeTruthy()
  })
})
