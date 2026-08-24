import { fireEvent, render, screen } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { AccompanimentTypesTable } from '../index'

const available = {
  type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
  usageCount: 0,
}
const used = {
  type: AccompanimentTypeFaker.fake({ id: 'type-2', name: 'Calda' }),
  usageCount: 2,
}

describe('AccompanimentTypesTable', () => {
  it('shows availability and prevents removal of types in use', () => {
    const onEdit = vi.fn()
    const onRemove = vi.fn()
    render(
      <AccompanimentTypesTable
        items={[available, used]}
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    )

    expect(
      screen.getByRole('region', { name: 'Tabela de tipos de acompanhamento' }),
    ).toBeTruthy()
    expect(screen.getByText('Sem vínculos')).toBeTruthy()
    expect(screen.getByText('2 vínculos')).toBeTruthy()
    expect(screen.getByText('Disponível')).toBeTruthy()
    expect(screen.getByText('Em uso')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Remover Calda' }).hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Editar Cobertura' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Cobertura' }))
    expect(onEdit).toHaveBeenCalledWith(available)
    expect(onRemove).toHaveBeenCalledWith(available)
  })
})
