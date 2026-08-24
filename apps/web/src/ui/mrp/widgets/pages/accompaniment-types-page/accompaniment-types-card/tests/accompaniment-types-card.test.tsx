import { fireEvent, render, screen } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { AccompanimentTypesCard } from '../index'

const page = {
  items: [
    {
      type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
      usageCount: 0,
    },
  ],
  page: 1,
  pageSize: 1,
  total: 2,
  totalPages: 2,
}

describe('AccompanimentTypesCard', () => {
  it('renders table guidance and delegates row and pagination actions', () => {
    const onEdit = vi.fn()
    const onPageChange = vi.fn()
    const onRemove = vi.fn()
    render(
      <AccompanimentTypesCard
        onEdit={onEdit}
        onPageChange={onPageChange}
        onRemove={onRemove}
        page={page}
      />,
    )

    expect(screen.getByText(/Tipos cadastrados/)).toBeTruthy()
    expect(screen.getByText(/Tipos em uso só podem ser removidos/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Cobertura' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onEdit).toHaveBeenCalledWith(page.items[0])
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
