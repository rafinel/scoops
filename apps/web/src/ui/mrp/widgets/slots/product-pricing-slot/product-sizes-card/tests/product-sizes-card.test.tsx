import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductSizeFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductSizesCard } from '../index'

describe('ProductSizesCard', () => {
  afterEach(cleanup)
  it('offers the first-size action when no sizes are configured', () => {
    const onAdd = vi.fn()

    render(
      <ProductSizesCard
        onAdd={onAdd}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        sizes={[]}
        unit='ml'
      />,
    )

    const addButton = screen.getByRole('button', { name: 'Adicionar primeiro tamanho' })
    fireEvent.click(addButton)

    expect(onAdd).toHaveBeenCalledWith(addButton)
  })

  it('renders the configured table and routes add, edit and remove actions', () => {
    const size = { size: ProductSizeFaker.fake({ name: '300 ml' }) }
    const onAdd = vi.fn()
    const onEdit = vi.fn()
    const onRemove = vi.fn()

    render(
      <ProductSizesCard
        onAdd={onAdd}
        onEdit={onEdit}
        onRemove={onRemove}
        sizes={[size]}
        unit='ml'
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tamanho' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar 300 ml' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover 300 ml' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(size, expect.any(HTMLElement))
    expect(onRemove).toHaveBeenCalledWith(size, expect.any(HTMLElement))
  })

  it('keeps configured size facts readable without management actions for Operators', () => {
    render(
      <ProductSizesCard
        canManage={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        sizes={[{ size: ProductSizeFaker.fake({ name: '300 ml' }) }]}
        unit='ml'
      />,
    )
    expect(screen.getAllByText('300 ml').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Adicionar tamanho' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar 300 ml' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover 300 ml' })).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Ações' })).toBeNull()
  })
})
